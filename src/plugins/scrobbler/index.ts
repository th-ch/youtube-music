import { createPlugin } from '@/utils';
import { t } from '@/i18n';

import { onMenu } from './menu';
import { backend } from './main';

export interface ScrobblerPluginConfig {
  enabled: boolean,
  /**
    * Attempt to scrobble other video types (e.g. Podcasts, normal YouTube videos)
    *
    * @default false
    */
  scrobble_other_media: boolean,
  scrobblers: {
    lastfm: {
      /**
       * Enable Last.fm scrobbling
       *
       * @default false
       */
      enabled: boolean,
      /**
       * Token used for authentication
       */
      token: string | undefined,
      /**
       * Session key used for scrobbling
       */
      session_key: string | undefined,
      /**
       * Root of the Last.fm API
       *
       * @default 'http://ws.audioscrobbler.com/2.0/'
       */
      api_root: string,
      /**
       * Last.fm api key registered by @semvis123
       *
       * @default '04d76faaac8726e60988e14c105d421a'
       */
      api_key: string,
      /**
       * Last.fm api secret registered by @semvis123
       *
       * @default 'a5d2a36fdf64819290f6982481eaffa2'
       */
      secret: string,
    },
    listenbrainz: {
      /**
       * Enable ListenBrainz scrobbling
       *
       * @default false
       */
      enabled: boolean,
      /**
       * Listenbrainz user token
       */
      token: string | undefined,
      /**
       * Root of the ListenBrainz API
       *
       * @default 'https://api.listenbrainz.org/1/'
       */
      api_root: string,
    },
  }
}

export const defaultConfig: ScrobblerPluginConfig = {
  enabled: false,
  scrobble_other_media: false,
  scrobblers: {
    lastfm: {
      enabled: false,
      token: undefined,
      session_key: undefined,
      api_root: 'http://ws.audioscrobbler.com/2.0/',
      api_key: '04d76faaac8726e60988e14c105d421a',
      secret: 'a5d2a36fdf64819290f6982481eaffa2',
    },
    listenbrainz: {
      enabled: false,
      token: undefined,
      api_root: 'https://api.listenbrainz.org/1/',
    },
  },
};

export default createPlugin({
  name: () => t('plugins.scrobbler.name'),
  description: () => t('plugins.scrobbler.description'),
  restartNeeded: true,
  config: defaultConfig,
  menu: onMenu,
  backend,
});
