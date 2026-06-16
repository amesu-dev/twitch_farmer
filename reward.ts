import { nanoid } from "nanoid";
import * as consts from './consts';
import events from "./events";

import { make_claim_points } from "./template/claim-points";
import { make_query } from "./utils";
import User from "./user";

let subscriptions: { [x: string]: string } = {};

let keepalive_timeout: NodeJS.Timeout | undefined;
const responses: { [x: string]: (ws: WebSocket, data: any) => void } = {
  welcome(ws: WebSocket, data: any) {
    ws.send(JSON.stringify(consts.auth_message));

    console.log(subscriptions);
    // Subscribe all useful events
    for (const id in subscriptions) {
      ws.send(JSON.stringify({
        "id": nanoid(),
        "type": "subscribe",
        "subscribe": {
          "id": id,
          "type": "pubsub",
          "pubsub": {
            "topic": subscriptions[id]
          }
        },
        "timestamp": new Date().toISOString()
      }));
    }

    keepalive_timeout = setTimeout(() => {
      ws.close();
    }, 1.2 * 1000 * data.welcome.keepaliveSec);
  },

  async notification(ws: WebSocket, data: any) {
    const content = JSON.parse(data.notification.pubsub);
    const subscrition = subscriptions[data.notification.subscription.id];
    console.log(`[MSG][${subscrition}]`, content);

    if (subscrition === consts.TWITCH_SELF_EVENTS.POINTS_EARNED) {
      if (content.type === "claim-available") {
        try {
          await make_query(
            make_claim_points,
            content.data.claim.channel_id,
            content.data.claim.id
          );
  
          console.log(`[INFO][${content.data.created_at}] Gained ${content.data.claim.points_gain.total_points} at ${content.data.claim.channel_id}`);
        } catch (e) {
          console.log("[ERROR] Something went wrong while claiming points.")
        }
      } else console.log(`[INFO] Balance at ${content?.data?.balance?.channel_id}: ${content?.data?.balance?.balance} points`);
    } else if (subscrition.startsWith(consts.TWITCH_CHANNEL_EVENTS.VIDEO_PLAYBACK)) {
      if (content.type === "viewcount") return;

      console.log("[INFO] Stream down: ", content);
      events.emit("stream:down", parseInt(subscrition.split(".")[1]));
    }
  },

  subscribeResponse(ws: WebSocket, data: any) {
    const subscrition = subscriptions[data.subscribeResponse.subscription.id];
    console.log(`[EVENT] [${data.subscribeResponse.result}] ${subscrition}`);

    if (data.subscribeResponse.result) console.error("[ERROR]", data.subscribeResponse);
  },

  keepalive() {
    keepalive_timeout?.refresh();
  }
};

export function init_reward_watch(target_list: User[], close_cb: (success: consts.WSEXIT_CODE) => void) {
  const ws = new WebSocket(`wss://hermes.twitch.tv/v1?clientId=${consts.client_id}`);

  subscriptions = {};
  for (const event in consts.TWITCH_SELF_EVENTS) {
    subscriptions[nanoid()] = consts.TWITCH_SELF_EVENTS[event as keyof typeof consts.TWITCH_SELF_EVENTS];
  }
  for (const event in consts.TWITCH_CHANNEL_EVENTS) {
    for (const streamer of target_list) {
      subscriptions[nanoid()] = `${consts.TWITCH_CHANNEL_EVENTS[event as keyof typeof consts.TWITCH_CHANNEL_EVENTS]}.${streamer.id}`;
    }
  }

  ws.onopen = () => {
    console.log('[WS] WebSocket connection opened');
  };

  ws.onmessage = async (event) => {
    if (event.type === "RECONNECT") {
      ws.close();
      close_cb(consts.WSEXIT_CODE.CONNECTION_LOST);
    }

    const data = JSON.parse(event.data);
    responses?.[data.type as string]?.(ws, data);
  };

  ws.onerror = (error) => {
    console.error('[WS][ERROR]', error);
    close_cb(consts.WSEXIT_CODE.ERROR);
  };

  ws.onclose = (event) => {
    if (event.reason !== "STREAM_END")
      close_cb(consts.WSEXIT_CODE.CONNECTION_LOST);
    else close_cb(consts.WSEXIT_CODE.END);
  }
}