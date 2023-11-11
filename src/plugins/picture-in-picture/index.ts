import style from './style.css?inline';

import { createPluginBuilder } from '../utils/builder';

export type PictureInPicturePluginConfig = {
  'enabled': boolean;
  'alwaysOnTop': boolean;
  'savePosition': boolean;
  'saveSize': boolean;
  'hotkey': 'P',
  'pip-position': [number, number];
  'pip-size': [number, number];
  'isInPiP': boolean;
  'useNativePiP': boolean;
}

const builder = createPluginBuilder('picture-in-picture', {
  name: 'Picture In Picture',
  restartNeeded: true,
  config: {
    'enabled': false,
    'alwaysOnTop': true,
    'savePosition': true,
    'saveSize': false,
    'hotkey': 'P',
    'pip-position': [10, 10],
    'pip-size': [450, 275],
    'isInPiP': false,
    'useNativePiP': true,
  } as PictureInPicturePluginConfig,
  styles: [style],
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
