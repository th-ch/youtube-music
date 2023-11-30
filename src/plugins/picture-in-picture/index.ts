import style from './style.css?inline';
import { createPlugin } from '@/utils';

import { onConfigChange, onMainLoad } from './main';
import { onMenu } from './menu';
import { onPlayerApiReady, onRendererLoad } from './renderer';

export type PictureInPicturePluginConfig = {
  enabled: boolean;
  alwaysOnTop: boolean;
  savePosition: boolean;
  saveSize: boolean;
  hotkey: 'P';
  'pip-position': [number, number];
  'pip-size': [number, number];
  isInPiP: boolean;
  useNativePiP: boolean;
};

export default createPlugin({
  name: 'Picture In Picture',
  description: 'Allows to switch the app to picture-in-picture mode',
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
