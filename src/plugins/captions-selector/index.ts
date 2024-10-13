import { createPlugin } from '@/utils';
import { YoutubePlayer } from '@/types/youtube-player';

import backend from './back';
import renderer, { CaptionsSelectorConfig, LanguageOptions } from './renderer';
import { t } from '@/i18n';

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
  name: () => t('plugins.captions-selector.name'),
  description: () => t('plugins.captions-selector.description'),
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
        label: t('plugins.captions-selector.menu.autoload'),
        type: 'checkbox',
        checked: config.autoload,
        click(item) {
          setConfig({ autoload: item.checked });
        },
      },
      {
        label: t('plugins.captions-selector.menu.disable-captions'),
        type: 'checkbox',
        checked: config.disableCaptions,
        click(item) {
          setConfig({ disableCaptions: item.checked });
        },
      },
    ];
  },

  backend,
  renderer,
});
