import { DefaultPresetList, Preset } from './types';

import style from './style.css?inline';

import { createPluginBuilder } from '../utils/builder';

export type DownloaderPluginConfig = {
  enabled: boolean;
  downloadFolder?: string;
  selectedPreset: string;
  customPresetSetting: Preset;
  skipExisting: boolean;
  playlistMaxItems?: number;
}

const builder = createPluginBuilder('downloader', {
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
  styles: [style],
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
