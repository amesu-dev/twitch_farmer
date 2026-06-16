// TODO: Dynamic events. Multiprocess
import { nanoid } from "nanoid";

// community-points-user-v1.<self_user_id>
// video-playback-by-id.<channel_id>
// raid.<channel_id>
export enum TWITCH_CHANNEL_EVENTS {
  RAID = "video-playback-by-id",
  VIDEO_PLAYBACK = "raid"
};
export enum TWITCH_SELF_EVENTS { // Past your id after dot
  POINTS_EARNED = "community-points-user-v1.",
  NOTIFICATIONS = "onsite-notifications."
}
// export type TWITCH_EVENTS = TWITCH_CHANNEL_EVENTS | TWITCH_SELF_EVENTS;

export enum WSEXIT_CODE {
  END,
  ERROR,
  CONNECTION_LOST
};

// Login and id of bot-user
export const self_user: string = "";
export const self_user_id: number = -1;
// Streamers usernames for farming their channel points
export const target_usernames: string[] = [];

// Important info
export const session_id: string = nanoid();
export const token: string = "";
export const client_id: string = "";
export const user_agent: string = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0";

// Not really matter info
export const app_version = "";
export const device_id = "";
export const platform = "web";
export const os = "windows";
export const client_app = "twilight";

export let headers = {
  'Client-Id': client_id,
  'Authorization': `OAuth ${token}`,
  'Device-Id': device_id,
  'Content-Type': 'text/plain;charset=UTF-8',
  'User-Agent': user_agent,
  'Origin': 'https://www.twitch.tv',
  'Accept-Language': 'ru-RU',
  'Client-Integrity': undefined as any as string,
  // 'Client-Session-Id': undefined as any as string,
  'Session-Id': undefined as any as string,
};

export const auth_message = {
  "id": nanoid(),
  "type": "authenticate",
  "authenticate": {
    "token": token
  },
};
