import * as consts from '../consts';
import User from '../user';

export const make_minute_watched = (user: User) => ({
  "event": "minute-watched",
  "properties": {
    // "app_session_id": "ea7c3fc5a02044c1",

    "channel": user.username,
    "channel_id": user.id.toString(),
    "url": `https://www.twitch.tv/${user.username}`,
    "page_session_id": consts.session_id,
    "app_version": consts.app_version,
    "user_id": consts.self_user_id,
    // "login": consts.self_user,
    "device_id": consts.device_id,
    "session_device_id": consts.device_id,
    // "distinct_id": consts.device_id,
    "user_agent": consts.user_agent,
    "player": "site",
    
    "client_time": new Date().toISOString(),
    "broadcast_id": user.broadcast_id.toString(),
    "game_id": user.game_id,

    "batch_time": 0,
    "time": 0,
    "decoded_frames": 0,
    "minutes_logged": 0,
  }
});