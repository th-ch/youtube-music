import { createPlugin } from '@/utils';
import { t } from '@/i18n';

import { onMainLoad, onConfigChange } from './main'; // Import onConfigChange
import { onRendererLoad } from './renderer';
import style from './style.css?inline';

export type OfflineTranslatorPluginConfig = {
  enabled: boolean;
  targetLanguage: string;
};

export default createPlugin<OfflineTranslatorPluginConfig>({
  name: () => t('plugins.offline-translator.name'),
  description: () => t('plugins.offline-translator.descriptionDetail'),
  restartNeeded: true,
  config: {
    enabled: false,
    targetLanguage: 'fra_Latn', // Default to French
  } as OfflineTranslatorPluginConfig,
  stylesheets: [style],
  menu: async ({ getConfig, setConfig }) => {
    const config = await getConfig();
    const availableLanguages = [
      { name: 'French', code: 'fra_Latn' },
      { name: 'Spanish', code: 'spa_Latn' },
      { name: 'German', code: 'deu_Latn' },
      { name: 'Portuguese', code: 'por_Latn' },
      { name: 'Italian', code: 'ita_Latn' },
      { name: 'Japanese', code: 'jpn_Jpan' },
      { name: 'Korean', code: 'kor_Hang' },
      { name: 'Chinese (Simplified)', code: 'zho_Hans' },
      { name: 'English', code: 'eng_Latn' },
    ];

    const languageItems = availableLanguages.map(lang => ({
      label: lang.name,
      type: 'radio',
      checked: config.targetLanguage === lang.code,
      click: () => {
        setConfig({ targetLanguage: lang.code });
      },
    } as Electron.MenuItemConstructorOptions)); // Cast to satisfy MenuContextNotChecked

    return [
      // Optional: A label for the radio group. The menu system seems to add section labels automatically or based on structure.
      // We can add a separator or a simple label item if needed, but often it's implicit.
      // { label: t('plugins.offline-translator.menu.target-language-select'), type: 'label' }, // Example if label needed
      ...languageItems,
    ];
  },
  backend: {
    start: onMainLoad,
    onConfigChange, // Add this
  },
  renderer: onRendererLoad,
});
