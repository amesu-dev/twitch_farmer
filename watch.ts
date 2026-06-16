// Experemental module that really watch stream for some reason
import * as consts from "./consts";
import { nanoid } from "nanoid";
import * as utils from "./utils";

(async () => {
  const auth_response = await fetch('https://gql.twitch.tv/gql', {
    method: 'POST',
    headers: consts.headers,
    body: JSON.stringify({
      "operationName": "PlaybackAccessToken_Template",
      "query": "query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!, $platform: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: $platform, playerBackend: \"mediaplayer\", playerType: $playerType}) @include(if: $isLive) {    value    signature   authorization { isForbidden forbiddenReasonCode }   __typename  }  videoPlaybackAccessToken(id: $vodID, params: {platform: $platform, playerBackend: \"mediaplayer\", playerType: $playerType}) @include(if: $isVod) {    value    signature   __typename  }}",
      "variables": {
        "isLive": true,
        "login": consts.target_usernames[0],
        "isVod": false,
        "vodID": "",
        "playerType": "site",
        "platform": consts.platform
      }
    }),
  }).then(res => res.json());

  console.log('[AUTH]', auth_response);

  const integrity = await fetch('https://gql.twitch.tv/integrity', {
    method: 'POST',
    headers: consts.headers,
  });

  console.log('[INTEGRITY]', integrity.headers.keys());
  console.log('[INTEGRITY]', await integrity.json());

  consts.headers['Client-Integrity'] = integrity.headers.get('client-integrity') || '';


  const video_params = new URLSearchParams();
  video_params.append('allow_source', 'true');
  video_params.append('browser_family', 'edge');
  video_params.append('browser_version', '148.0');
  video_params.append('cdm', 'vw');
  video_params.append('sig', auth_response.data.streamPlaybackAccessToken.signature);
  video_params.append('token', auth_response.data.streamPlaybackAccessToken.value);

  video_params.append('player_backend', 'mediaplayer');
  video_params.append('player_version', '1.53.0-rc.1');
  video_params.append('platform', consts.platform);
  video_params.append('play_session_id', nanoid());
  video_params.append('supported_codecs', 'av1,h265,h264');

  video_params.append('acmb', Buffer.from(JSON.stringify({
    "AppVersion": consts.app_version,
    "ClientApp": consts.client_app,
    "URL": `https://www.twitch.tv/${consts.target_usernames[0]}`,
  })).toString('base64'));

  const source_url = await fetch(`https://usher.ttvnw.net/api/v2/channel/hls/${consts.target_usernames[0]}.m3u8?${video_params.toString()}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, application/json, text/plain',
      'Client-Id': consts.client_id,
      'Authorization': `OAuth ${consts.token}`,
      'Device-Id': consts.device_id,
      'User-Agent': consts.user_agent,
    }
  }).then(res => res.text()).then(text => {
    const lines = text.split('\n');
    const line_160p = lines.findIndex(line => line.includes('IVS-NAME="160p"'));

    console.log('[SOURCE] Resolution', line_160p > 0 ? '160p' : 'source');
    return line_160p > 0 ? lines[line_160p + 1] : lines[lines.length - 1];
  });


  while (true) {
    try {
      const [ chunk_url, segment ] = await fetch(source_url, {
        method: 'GET',
        headers: {
          'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, application/json, text/plain',
          'Client-Id': consts.client_id,
          'Authorization': `OAuth ${consts.token}`,
          'Device-Id': consts.device_id,
          'User-Agent': consts.user_agent,
        },
      }).then(res => res.text()).then(text => {
        const video_lines = text.split('\n');
        return [
          video_lines[video_lines.length - 2],
          video_lines[3].split(':')[1]
        ];
      });

      try {
        await fetch(chunk_url);
      } catch(e) {}

    } catch (e) {
      console.error('[ERROR][PLAYBACK]', e);
    }
    await utils.sleep(2000);
  }
})()