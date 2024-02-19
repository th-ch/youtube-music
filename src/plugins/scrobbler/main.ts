import registerCallback, { MediaType, type SongInfo } from '@/providers/song-info';
import { createBackend } from '@/utils';

import { ScrobblerPluginConfig } from './index';
import { LastFmScrobbler } from './services/lastfm';
import { ListenbrainzScrobbler } from './services/listenbrainz';
import { ScrobblerBase } from './services/base';

export type SetConfType = (
  conf: Partial<Omit<ScrobblerPluginConfig, 'enabled'>>,
) => void | Promise<void>;

export const backend = createBackend<{
  config?: ScrobblerPluginConfig;
  enabledScrobblers: Map<string, ScrobblerBase>;
  toggleScrobblers(config: ScrobblerPluginConfig): void;
}, ScrobblerPluginConfig>({
  enabledScrobblers: new Map(),

  toggleScrobblers(config: ScrobblerPluginConfig) {
    if (config.scrobblers.lastfm && config.scrobblers.lastfm.enabled) {
      this.enabledScrobblers.set('lastfm', new LastFmScrobbler());
    } else {
      this.enabledScrobblers.delete('lastfm');
    }

    if (config.scrobblers.listenbrainz && config.scrobblers.listenbrainz.enabled) {
      this.enabledScrobblers.set('listenbrainz', new ListenbrainzScrobbler());
    } else {
      this.enabledScrobblers.delete('listenbrainz');
    }
  },

  async start({
    getConfig,
    setConfig,
  }) {
    const config = this.config = await getConfig();
    // This will store the timeout that will trigger addScrobble
    let scrobbleTimer: NodeJS.Timeout | undefined;

    this.toggleScrobblers(config);
    for (const [, scrobbler] of this.enabledScrobblers) {
      if (!scrobbler.isSessionCreated(config)) {
        await scrobbler.createSession(config, setConfig);
      }
    }

    registerCallback((songInfo: SongInfo) => {
      // Set remove the old scrobble timer
      clearTimeout(scrobbleTimer);
      if (!songInfo.isPaused) {
        const configNonnull = this.config!;
        // Scrobblers normally have no trouble working with official music videos
        if (!configNonnull.scrobble_other_media && (songInfo.mediaType !== MediaType.Audio && songInfo.mediaType !== MediaType.OriginalMusicVideo)) {
          return;
        }

        // Scrobble when the song is halfway through, or has passed the 4-minute mark
        const scrobbleTime = Math.min(Math.ceil(songInfo.songDuration / 2), 4 * 60);
        if (scrobbleTime > (songInfo.elapsedSeconds ?? 0)) {
          // Scrobble still needs to happen
          const timeToWait = (scrobbleTime - (songInfo.elapsedSeconds ?? 0)) * 1000;
          scrobbleTimer = setTimeout((info, config) => {
            this.enabledScrobblers.forEach((scrobbler) => scrobbler.addScrobble(info, config, setConfig));
          }, timeToWait, songInfo, configNonnull);
        }

        this.enabledScrobblers.forEach((scrobbler) => scrobbler.setNowPlaying(songInfo, configNonnull, setConfig));
      }
    });
  },

  onConfigChange(newConfig: ScrobblerPluginConfig) {
    this.enabledScrobblers.clear();

    this.config = newConfig;

    this.toggleScrobblers(this.config);
  }
});

