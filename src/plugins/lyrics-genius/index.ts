import style from './style.css?inline';

import { createPluginBuilder } from '../utils/builder';

export type LyricsGeniusPluginConfig = {
  enabled: boolean;
  romanizedLyrics: boolean;
}

const builder = createPluginBuilder('lyrics-genius', {
  name: 'Lyrics Genius',
  restartNeeded: true,
  config: {
    enabled: false,
    romanizedLyrics: false,
  } as LyricsGeniusPluginConfig,
  styles: [style],
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
