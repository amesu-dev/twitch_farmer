import * as consts from './consts';

export function init_chat(username: string, close_cb: (success: consts.WSEXIT_CODE) => void) {
  let pong_interval: NodeJS.Timeout;
  const chat_ws = new WebSocket(`wss://irc-ws.chat.twitch.tv:443`);

  chat_ws.onclose = () => close_cb(consts.WSEXIT_CODE.END);
  chat_ws.onerror = () => close_cb(consts.WSEXIT_CODE.ERROR);
  chat_ws.onopen = () => {
    console.log(`[CHAT WS] ${username} chat WebSocket connection opened`);
    chat_ws.send(`CAP REQ :twitch.tv/tags twitch.tv/commands`);
    chat_ws.send(`PASS oauth:${consts.token}`);
    chat_ws.send(`NICK ${consts.self_user}`);
    chat_ws.send(`USER ${consts.self_user} 8 * :${consts.self_user}`);
    chat_ws.send(`JOIN #${username}`);
  };
  
  chat_ws.onmessage = (event) => {
    const message = event.data as string;

    // Prevent closing
    if (message.startsWith("PONG"))
      return pong_interval.close();
    
    if (message.startsWith("PING"))
      return chat_ws.send("PONG");
    
    const display_name_match = message.match(/name=([^;]+);/);
    const display_name = display_name_match ? display_name_match[1] : null;
  
    const message_match = message.match(/PRIVMSG #(.+) :(.+)$/m);
    const msg_content = message_match ? message_match[2] : null;
  
    if (display_name && msg_content) console.log(`[CHAT ${username}] ${display_name}: ${msg_content}`);
  };

  setInterval(() => {
    chat_ws.send("PING");

    pong_interval = setInterval(() => { // Close connection after 10sec of silent
      chat_ws.close();
      close_cb(consts.WSEXIT_CODE.CONNECTION_LOST);
    }, 10 * 1000);
  }, 30 * 1000);

  return chat_ws;
}