import { createPlugin } from '@/utils';
import { YoutubePlayer } from '@/types/youtube-player';

import backend from './back';
import renderer, { CaptionsSelectorConfig, LanguageOptions } from './renderer';

export default createPlugin<
  unknown,
  unknown,
  {
    captionsSettingsButton: HTMLElement;
    captionTrackList: LanguageOptions[] | null;
    api: YoutubePlayer | null;
    config: CaptionsSelectorConfig | null;
    setConfig: (config: Partial<CaptionsSelectorConfig>) => void;
    videoChangeListener: () => void;
    captionsButtonClickListener: () => void;
  },
  CaptionsSelectorConfig
>({
  name: 'Captions Selector',
  description: 'Caption selector for YouTube Music audio tracks',
  config: {
    enabled: false,
    disableCaptions: false,
    autoload: false,
    lastCaptionsCode: '',
  },

  async menu({ getConfig, setConfig }) {
    const config = await getConfig();
    return [
      {
        label: 'Automatically select last used caption',
        type: 'checkbox',
        checked: config.autoload as boolean,
        click(item) {
          setConfig({ autoload: item.checked });
        },
      },
      {
        label: 'No captions by default',
        type: 'checkbox',
        checked: config.disableCaptions as boolean,
        click(item) {
          setConfig({ disableCaptions: item.checked });
        },
      },
    ];
  },

  backend,
  renderer,
});
