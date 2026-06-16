import * as consts from './consts';
import { nanoid } from 'nanoid';
import { make_info_body } from './template/stream-info';
import { broadbcast_info_body } from './template/broadcast-info';

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type FuncParams<F extends Function> = F extends (...args: infer A) => any ? A : never;
export async function make_query<F extends Function>(
  query: F, ...args: FuncParams<F>
) {
  const body = query(...args);

  return await fetch('https://gql.twitch.tv/gql', {
    method: 'POST',
    headers: consts.headers,
    body: JSON.stringify(body)
  }).then(res => res.json());
}
