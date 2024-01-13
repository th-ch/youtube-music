import { SetConfType } from '../main';
import { SongInfo } from '@/providers/song-info';
import { net } from 'electron';
import type { ScrobblerPluginConfig } from '@/plugins/scrobbler';
import { ScrobblerBase } from '@/plugins/scrobbler/services/base';

export class ListenbrainzScrobbler extends ScrobblerBase {
  async createSession(config: ScrobblerPluginConfig, _setConfig: SetConfType): Promise<ScrobblerPluginConfig> {
    return config;
  };

  setNowPlaying(songInfo: SongInfo, config: ScrobblerPluginConfig, _setConfig: SetConfType): void {
    if (!config.listenbrainz_options.api_root || !config.listenbrainz_options.token) {
      return;
    }

    let body = createRequestBody("playing_now", songInfo);
    submitListen(body, config);
  };

  addScrobble(songInfo: SongInfo, config: ScrobblerPluginConfig, _setConfig: SetConfType): void {
    if (!config.listenbrainz_options.api_root || !config.listenbrainz_options.token) {
      return;
    }

    let body = createRequestBody("single", songInfo);
    body.payload[0].listened_at = Math.trunc(Date.now() / 1000);

    submitListen(body, config);
  };
}

function createRequestBody(listenType: string, songInfo: SongInfo): any {
  let trackMetadata: any = {
    artist_name: songInfo.artist,
    track_name: songInfo.title,
    release_name: songInfo.album ?? undefined,
    additional_info: {
      media_player: "YouTube Music Desktop App",
      submission_client: "YouTube Music Desktop App - Scrobbler Plugin",
      origin_url: songInfo.url,
      duration: songInfo.songDuration,
    }
  }

  return {
    listen_type: listenType,
    payload: [
      {
        track_metadata: trackMetadata,
      }
    ]
  };
}

function submitListen(body: any, config: ScrobblerPluginConfig) {
  body = JSON.stringify(body, (_k, v) => v ?? undefined)

  net.fetch(config.listenbrainz_options.api_root + "submit-listens",
    {
      method: 'POST',
      body,
      headers: {
        'Authorization': 'Token ' + config.listenbrainz_options.token,
        'Content-Type': 'application/json',
      }
    }).catch(console.error)
}
