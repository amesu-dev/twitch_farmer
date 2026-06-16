import * as consts from './consts';
import * as zlib from 'node:zlib';
import { make_general_event } from "./template/general";
import { make_minute_watched } from './template/minute-watched';
import User from './user';
import events from './events';
import { sleep } from './utils';
import { init_reward_watch } from './reward';
import { init_chat } from './chat';

// (async () => {
//   const auth_response = await fetch('https://gql.twitch.tv/gql', {
//     method: 'POST',
//     headers: consts.headers,
//     body: JSON.stringify({
//       "operationName": "PlaybackAccessToken_Template",
//       "query": "query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!, $platform: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: $platform, playerBackend: \"mediaplayer\", playerType: $playerType}) @include(if: $isLive) {    value    signature   authorization { isForbidden forbiddenReasonCode }   __typename  }  videoPlaybackAccessToken(id: $vodID, params: {platform: $platform, playerBackend: \"mediaplayer\", playerType: $playerType}) @include(if: $isVod) {    value    signature   __typename  }}",
//       "variables": {
//         "isLive": true,
//         "login": consts.target_user,
//         "isVod": false,
//         "vodID": "",
//         "playerType": "site",
//         "platform": consts.platform
//       }
//     }),
//   }).then(res => res.json());

//   console.log('[AUTH]', auth_response);

//   const integrity = await fetch('https://gql.twitch.tv/integrity', {
//     method: 'POST',
//     headers: consts.headers,
//   });

//   console.log('[INTEGRITY]', integrity.headers.keys());
//   console.log('[INTEGRITY]', await integrity.json());

//   consts.headers['Client-Integrity'] = integrity.headers.get('client-integrity') || '';


//   const video_params = new URLSearchParams();
//   video_params.append('allow_source', 'true');
//   video_params.append('browser_family', 'edge');
//   video_params.append('browser_version', '148.0');
//   video_params.append('cdm', 'vw');
//   video_params.append('sig', auth_response.data.streamPlaybackAccessToken.signature);
//   video_params.append('token', auth_response.data.streamPlaybackAccessToken.value);

//   video_params.append('player_backend', 'mediaplayer');
//   video_params.append('player_version', '1.53.0-rc.1');
//   video_params.append('platform', consts.platform);
//   video_params.append('play_session_id', nanoid());
//   video_params.append('supported_codecs', 'av1,h265,h264');

//   video_params.append('acmb', Buffer.from(JSON.stringify({
//     "AppVersion": consts.app_version,
//     "ClientApp": consts.client_app,
//     "URL": `https://www.twitch.tv/${consts.target_user}`,
//   })).toString('base64'));

//   const source_url = await fetch(`https://usher.ttvnw.net/api/v2/channel/hls/${consts.target_user}.m3u8?${video_params.toString()}`, {
//     method: 'GET',
//     headers: {
//       'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, application/json, text/plain',
//       'Client-Id': consts.client_id,
//       'Authorization': `OAuth ${consts.token}`,
//       'Device-Id': consts.device_id,
//       'User-Agent': consts.user_agent,
//     }
//   }).then(res => res.text()).then(text => {
//     const lines = text.split('\n');
//     const line_160p = lines.findIndex(line => line.includes('IVS-NAME="160p"'));

//     console.log('[SOURCE] Resolution', line_160p > 0 ? '160p' : 'source');
//     return line_160p > 0 ? lines[line_160p + 1] : lines[lines.length - 1];
//   });


//   const begin_timestamp = Date.now();
//   let last_minute_emitted_at = begin_timestamp;
//   let minute_count = 0;
//   let begin_frame = 0;
//   let event = { ...minute_watched_event };
//   while (true) {
//     try {
//       const [ chunk_url, segment ] = await fetch(source_url, {
//         method: 'GET',
//         headers: {
//           'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, application/json, text/plain',
//           'Client-Id': consts.client_id,
//           'Authorization': `OAuth ${consts.token}`,
//           'Device-Id': consts.device_id,
//           'User-Agent': consts.user_agent,
//         },
//       }).then(res => res.text()).then(text => {
//         const video_lines = text.split('\n');
//         return [
//           video_lines[video_lines.length - 2],
//           video_lines[3].split(':')[1]
//         ];
//       });

//       if (!begin_frame) begin_frame = parseInt(segment, 10);

//       if (Date.now() - last_minute_emitted_at >= 60000) {
//         last_minute_emitted_at = Date.now();
//         minute_count++;

//         event.properties.time =
//         event.properties.batch_time = last_minute_emitted_at - begin_timestamp;

//         event.properties.decoded_frames = parseInt(segment, 10) - begin_frame;
//         event.properties.minutes_logged = minute_count;
//         event.properties.client_time = new Date().toISOString();

//         const stream_info = await utils.get_stream_info();
//         if(stream_info.data.user.stream == null) return console.log("[INFO] Stream ended!");

//         event.properties.game_id = stream_info.data.user.stream.game.id;
//         event.properties.broadcast_id = stream_info.data.user.stream.id;
//         // event.properties.category_id = event.properties.game_id;
//         // event.properties.game = info.data.user.stream.game.displayName;

//         let event_body = { ...general_event };
//         event_body.variables = { ...general_event.variables };
//         event_body.variables.input = { ...general_event.variables.input };
//         event_body.variables.input.data = zlib.gzipSync(JSON.stringify(event)).toString("base64");
//         console.log(event_body);
//         await fetch('https://gql.twitch.tv/gql', {
//           method: 'POST',
//           headers: consts.headers,
//           body: JSON.stringify(event_body),
//         }).then(res => res.json())
//         .then(json => console.log("[EVENT] Response:", json));

//         console.log('[EVENT] Minute watched event');
//       }

//       try {
//         await fetch(chunk_url);
//       } catch(e) {}

//     } catch (e) {
//       console.error('[ERROR][PLAYBACK]', e);
//     }
//     await utils.sleep(2000);
//   }
// })()



// let event = { ...minute_watched_event };

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


  while (true) {
    if (is_reward_down) {
      init_reward_watch(manager.streamers, renew_reward_watch);
      is_reward_down = false;
    }

    await sleep(1000);
  };
})()
