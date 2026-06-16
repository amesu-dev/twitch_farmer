import { EventEmitter } from 'node:events';
import User from './user';

interface IEvents {
  'stream:up': [streamer: typeof User.prototype.id];
  'stream:down': [streamer: typeof User.prototype.id];
}

class Events extends EventEmitter {
  override emit<K extends keyof IEvents>(event: K, ...args: IEvents[K]): boolean {
    return super.emit(event, ...args);
  }

  override on<K extends keyof IEvents>(event: K, listener: (...args: IEvents[K]) => void): this {
    return super.on(event, listener);
  }

  override once<K extends keyof IEvents>(event: K, listener: (...args: IEvents[K]) => void): this {
    return super.on(event, listener);
  }

  override off<K extends keyof IEvents>(event: K, listener: (...args: IEvents[K]) => void): this {
    return super.off(event, listener);
  }
}

export default new Events();