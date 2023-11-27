import { createPlugin } from '@/utils';
import registerCallback from '@/providers/song-info';
import { addScrobble, getAndSetSessionKey, setNowPlaying } from './main';

export interface LastFmPluginConfig {
  enabled: boolean;
  /**
   * Token used for authentication
   */
  token?: string;
  /**
   * Session key used for scrabbling
   */
  session_key?: string;
  /**
   * Root of the Last.fm API
   *
   * @default 'http://ws.audioscrobbler.com/2.0/'
   */
  api_root: string;
  /**
   * Last.fm api key registered by @semvis123
   *
   * @default '04d76faaac8726e60988e14c105d421a'
   */
  api_key: string;
  /**
   * Last.fm api secret registered by @semvis123
   *
   * @default 'a5d2a36fdf64819290f6982481eaffa2'
   */
  secret: string;
}

export default createPlugin({
  name: 'Last.fm',
  restartNeeded: true,
  config: {
    enabled: false,
    api_root: 'http://ws.audioscrobbler.com/2.0/',
    api_key: '04d76faaac8726e60988e14c105d421a',
    secret: 'a5d2a36fdf64819290f6982481eaffa2',
  } as LastFmPluginConfig,
  async backend({ getConfig, setConfig }) {
    let config = await getConfig();
    // This will store the timeout that will trigger addScrobble
    let scrobbleTimer: number | undefined;

    if (!config.api_root) {
      config.enabled = true;
      setConfig(config);
    }

    if (!config.session_key) {
      // Not authenticated
      config = await getAndSetSessionKey(config, setConfig);
    }

    registerCallback((songInfo) => {
      // Set remove the old scrobble timer
      clearTimeout(scrobbleTimer);
      if (!songInfo.isPaused) {
        setNowPlaying(songInfo, config, setConfig);
        // Scrobble when the song is halfway through, or has passed the 4-minute mark
        const scrobbleTime = Math.min(Math.ceil(songInfo.songDuration / 2), 4 * 60);
        if (scrobbleTime > (songInfo.elapsedSeconds ?? 0)) {
          // Scrobble still needs to happen
          const timeToWait = (scrobbleTime - (songInfo.elapsedSeconds ?? 0)) * 1000;
          scrobbleTimer = setTimeout(addScrobble, timeToWait, songInfo, config);
        }
      }
    });
  }
});
