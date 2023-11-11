import { createPluginBuilder } from '../utils/builder';

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

const builder = createPluginBuilder('last-fm', {
  name: 'Last.fm',
  restartNeeded: true,
  config: {
    enabled: false,
    api_root: 'http://ws.audioscrobbler.com/2.0/',
    api_key: '04d76faaac8726e60988e14c105d421a',
    secret: 'a5d2a36fdf64819290f6982481eaffa2',
  } as LastFmPluginConfig,
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
