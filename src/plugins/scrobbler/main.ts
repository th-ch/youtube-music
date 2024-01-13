import registerCallback, { SongInfo } from '@/providers/song-info';
import { ScrobblerPluginConfig } from '@/plugins/scrobbler/index';
import { LastFmScrobbler } from '@/plugins/scrobbler/services/lastfm';
import { ListenbrainzScrobbler } from '@/plugins/scrobbler/services/listenbrainz';
import { setOptions } from '@/config/plugins';
import { BackendContext } from '@/types/contexts';
import { ScrobblerBase } from '@/plugins/scrobbler/services/base';

export type SetConfType = (
  conf: Partial<Omit<ScrobblerPluginConfig, 'enabled'>>,
) => void | Promise<void>;

const enabledScrobblers: { [id: string] : ScrobblerBase | undefined } = {
  "lastfm": undefined,
  "listenbrainz": undefined,
};

export function toggleScrobblers(config: ScrobblerPluginConfig) {
  if (config.lastfm_options && config.lastfm_options.enabled) {
    enabledScrobblers["lastfm"] = new LastFmScrobbler();
  } else {
    enabledScrobblers["lastfm"] = undefined;
  }

  if (config.listenbrainz_options && config.listenbrainz_options.enabled) {
    enabledScrobblers["listenbrainz"] = new ListenbrainzScrobbler();
  } else {
    enabledScrobblers["listenbrainz"] = undefined;
  }
}

function forEachScrobbler(callback: (scrobbler: ScrobblerBase) => void) {
  let prop: keyof typeof enabledScrobblers;
  for (prop in enabledScrobblers) {
    if (enabledScrobblers[prop]) {
      callback(enabledScrobblers[prop] as ScrobblerBase);
    }
  }
}

function unloadScrobblers() {
  for (let scrobbler of Object.values(enabledScrobblers)) {
    if (scrobbler) {
      scrobbler = undefined;
    }
  }
}

let config: ScrobblerPluginConfig;

export async function onMainLoad({
  getConfig,
  setConfig,
}: BackendContext<ScrobblerPluginConfig>){
  config = await getConfig();
  // This will store the timeout that will trigger addScrobble
  let scrobbleTimer: number | undefined;

  toggleScrobblers(config);
  if (config.lastfm_options && !config.lastfm_options.session_key) {
    await enabledScrobblers["lastfm"]?.createSession(config, setConfig);
  }

  registerCallback((songInfo: SongInfo) => {
    // Set remove the old scrobble timer
    clearTimeout(scrobbleTimer);
    if (!songInfo.isPaused) {
      // Scrobble when the song is halfway through, or has passed the 4-minute mark
      const scrobbleTime = Math.min(Math.ceil(songInfo.songDuration / 2), 4 * 60);
      if (scrobbleTime > (songInfo.elapsedSeconds ?? 0)) {
        // Scrobble still needs to happen
        const timeToWait = (scrobbleTime - (songInfo.elapsedSeconds ?? 0)) * 1000;
        scrobbleTimer = setTimeout(() => {
          forEachScrobbler((scrobbler) => scrobbler.addScrobble(songInfo, config, setConfig));
        }, timeToWait, songInfo, config);
      }

      forEachScrobbler((scrobbler) => scrobbler.setNowPlaying(songInfo, config, setConfig));
    }
  });
}

export function onConfigChange(newConfig: ScrobblerPluginConfig) {
  unloadScrobblers();

  config = newConfig;
  if (!config.lastfm_options && !config.listenbrainz_options) {
    config.enabled = true;
    setOptions('scrobbler', config);
  }

  toggleScrobblers(config);
}

