import style from './style.css?inline';

import { createPluginBuilder } from '../utils/builder';

export type AmbientModePluginConfig = {
  enabled: boolean;
  quality: number;
  buffer: number;
  interpolationTime: number;
  blur: number;
  size: number;
  opacity: number;
  fullscreen: boolean;
};
const builder = createPluginBuilder('ambient-mode', {
  name: 'Ambient Mode',
  restartNeeded: false,
  config: {
    enabled: false,
    quality: 50,
    buffer: 30,
    interpolationTime: 1500,
    blur: 100,
    size: 100,
    opacity: 1,
    fullscreen: false,
  } as AmbientModePluginConfig,
  styles: [style],
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
