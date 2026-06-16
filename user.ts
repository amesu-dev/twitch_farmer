import { make_info_body } from "./template/stream-info";
import { make_query } from "./utils";

export default class User {
  id: number = -1;
  username: string = "";
  game_id: string = "";
  broadcast_id: string = "";

  is_online: boolean = false;
  chat_ws?: WebSocket;
  

  constructor(username: string) {
    this.username = username;
  }

  async update() {
    const stream_info = await make_query(make_info_body, this.username);

    this.id = stream_info.data.user.id;
    this.is_online = stream_info.data.user.stream !== null;
    this.game_id = stream_info.data.user?.stream?.game?.id || "";
    this.broadcast_id = stream_info.data.user?.stream?.id || "";
  }
}
