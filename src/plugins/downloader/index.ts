import { DefaultPresetList, Preset } from './types';

import style from './style.css?inline';

import { createPlugin } from '@/utils';
import { onConfigChange, onMainLoad } from '@/plugins/downloader/main';
import { onPlayerApiReady, onRendererLoad } from '@/plugins/downloader/renderer';

export type DownloaderPluginConfig = {
  enabled: boolean;
  downloadFolder?: string;
  selectedPreset: string;
  customPresetSetting: Preset;
  skipExisting: boolean;
  playlistMaxItems?: number;
}

export default createPlugin({
  name: 'Downloader',
  restartNeeded: true,
  config: {
    enabled: false,
    downloadFolder: undefined,
    selectedPreset: 'mp3 (256kbps)', // Selected preset
    customPresetSetting: DefaultPresetList['mp3 (256kbps)'], // Presets
    skipExisting: false,
    playlistMaxItems: undefined,
  } as DownloaderPluginConfig,
  stylesheets: [style],
  backend: {
    start: onMainLoad,
    onConfigChange,
  },
  renderer: {
    start: onRendererLoad,
    onPlayerApiReady,
  }
});

