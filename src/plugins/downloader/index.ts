import { DefaultPresetList, Preset } from './types';

import style from './style.css?inline';

import { createPlugin } from '@/utils';
import { onConfigChange, onMainLoad } from './main';
import { onPlayerApiReady, onRendererLoad } from './renderer';
import { onMenu } from './menu';
import { t } from '@/i18n';

export type DownloaderPluginConfig = {
  enabled: boolean;
  downloadFolder?: string;
  downloadOnFinish: boolean;
  downloadOnFinishSeconds: number;
  downloadOnFinishPercent: number;
  downloadOnFinishMode: 'percent' | 'seconds';
  downloadOnFinishFolder?: string;
  selectedPreset: string;
  customPresetSetting: Preset;
  skipExisting: boolean;
  playlistMaxItems?: number;
};

export const defaultConfig: DownloaderPluginConfig = {
  enabled: false,
  downloadFolder: undefined,
  downloadOnFinish: false,
  downloadOnFinishSeconds: 20,
  downloadOnFinishPercent: 10,
  downloadOnFinishMode: 'seconds',
  downloadOnFinishFolder: undefined,
  selectedPreset: 'mp3 (256kbps)', // Selected preset
  customPresetSetting: DefaultPresetList['mp3 (256kbps)'], // Presets
  skipExisting: false,
  playlistMaxItems: undefined,
};

export default createPlugin({
  name: () => t('plugins.downloader.name'),
  description: () => t('plugins.downloader.description'),
  restartNeeded: true,
  config: defaultConfig,
  stylesheets: [style],
  menu: onMenu,
  backend: {
    start: onMainLoad,
    onConfigChange,
  },
  renderer: {
    start: onRendererLoad,
    onPlayerApiReady,
  },
});
