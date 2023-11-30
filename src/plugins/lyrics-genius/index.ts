import style from './style.css?inline';
import { createPlugin } from '@/utils';
import { onConfigChange, onMainLoad } from './main';
import { onRendererLoad } from './renderer';

export type LyricsGeniusPluginConfig = {
  enabled: boolean;
  romanizedLyrics: boolean;
}

export default createPlugin({
  name: 'Lyrics Genius',
  description: 'Adds lyrics support for most songs',
  restartNeeded: true,
  config: {
    enabled: false,
    romanizedLyrics: false,
  } as LyricsGeniusPluginConfig,
  stylesheets: [style],
  async menu({ getConfig, setConfig }) {
    const config = await getConfig();

    return [
      {
        label: 'Romanized Lyrics',
        type: 'checkbox',
        checked: config.romanizedLyrics,
        click(item) {
          setConfig({
            romanizedLyrics: item.checked,
          });
        },
      },
    ];
  },

  backend: {
    start: onMainLoad,
    onConfigChange,
  },
  renderer: onRendererLoad,
});
