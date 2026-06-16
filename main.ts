import * as consts from './consts';
import * as zlib from 'node:zlib';
import { make_general_event } from "./template/general";
import { make_minute_watched } from './template/minute-watched';
import User from './user';
import events from './events';
import { sleep } from './utils';
import { init_reward_watch } from './reward';
import { init_chat } from './chat';

class StreamerManager {
  streamer_timeout: Map<User, NodeJS.Timeout> = new Map();
  streamer_chat: Map<User, NodeJS.Timeout> = new Map();
  streamers: User[] = [];

  async init() {
    for (const username of consts.target_usernames) {
      const streamer = new User(username);
      this.streamers.push(streamer);
      await streamer.update();

      if (streamer.is_online) this.process(streamer);

      events.on("stream:up", (id: number) =>  {
        const streamer = this.streamers.find((u) => u.id == id);
        if (streamer) this.process(streamer);
      });
      events.on("stream:down", (id: number) =>  {
        const streamer = this.streamers.find((u) => u.id == id);
        if (streamer) this.process_kill(streamer);
      });
    }
  }

  private async watch_minute(streamer: User) {
    let event = make_minute_watched(streamer);

    let event_body = make_general_event(
      zlib.gzipSync(JSON.stringify(event)).toString("base64")
    );
    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: consts.headers,
      body: JSON.stringify(event_body),
    }).then(res => res.json());

    if (res.status >= 300) console.error(`[ERROR][Watch] ${streamer.username} caused:`, res?.message)
    else console.log('[EVENT] Minute watched event');
  }

  /**
   * @returns {boolean} Should we reconnect?
   */
  private async handle_chat_down(streamer: User, reason: consts.WSEXIT_CODE) {
    console.log(`[CHAT] ${streamer.username} chat down caused by`, reason.toString());

    await streamer.update();
    if (streamer.is_online) return console.log(`[CHAT] Reconnecting to ${streamer.username}...`);

    this.streamer_chat.get(streamer)?.close();
    this.streamer_chat.delete(streamer);
  }

  private process(streamer: User) {
    if (!streamer.is_online) return;
    if (this.streamer_timeout.has(streamer)) return;

    this.watch_minute(streamer);
    const timeout = setInterval(() => this.watch_minute(streamer), 60 * 1000 + 1);
    this.streamer_timeout.set(streamer, timeout);

    streamer.chat_ws = init_chat(streamer.username, (reason: consts.WSEXIT_CODE) => this.handle_chat_down(streamer, reason));
    const interval = setInterval(() => {
      // ws.CLOSING = 2; ws.CLOSED = 2
      if (streamer.chat_ws?.readyState as number < 2) return;
      streamer.chat_ws = init_chat(streamer.username, (reason: consts.WSEXIT_CODE) => this.handle_chat_down(streamer, reason));
    },2000);
    this.streamer_chat.set(streamer, interval);
  }

  private process_kill(streamer: User) {
    // Kill watching
    this.streamer_timeout.get(streamer)?.close();
    this.streamer_timeout.delete(streamer);

    streamer.chat_ws?.close();
  }

};



(async () => {
  const manager = new StreamerManager();
  await manager.init();
  
  let is_reward_down = true;
  const renew_reward_watch = () => is_reward_down = true; 

  // Recursion replaced with cycles to void stack overflowing
  while (true) {
    if (is_reward_down) {
      init_reward_watch(manager.streamers, renew_reward_watch);
      is_reward_down = false;
    }

    await sleep(1000);
  };
})()
