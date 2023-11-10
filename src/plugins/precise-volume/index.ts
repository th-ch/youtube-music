import hudStyle from './volume-hud.css?inline';

import { createPluginBuilder } from '../utils/builder';

export type PreciseVolumePluginConfig = {
  enabled: boolean;
  steps: number;
  arrowsShortcut: boolean;
  globalShortcuts: {
    volumeUp: string;
    volumeDown: string;
  };
  savedVolume: number | undefined;
};

const builder = createPluginBuilder('precise-volume', {
  name: 'Precise Volume',
  config: {
    enabled: false,
    steps: 1, // Percentage of volume to change
    arrowsShortcut: true, // Enable ArrowUp + ArrowDown local shortcuts
    globalShortcuts: {
      volumeUp: '',
      volumeDown: '',
    },
    savedVolume: undefined, // Plugin save volume between session here
  } as PreciseVolumePluginConfig,
  styles: [hudStyle],
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
