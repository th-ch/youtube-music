import titlebarStyle from './titlebar.css?inline';
import { createPlugin } from '@/utils';
import { onMainLoad } from './main';
import { onMenu } from './menu';
import { onPlayerApiReady, onRendererLoad } from './renderer';

export interface InAppMenuConfig {
  enabled: boolean;
  hideDOMWindowControls: boolean;
}

export default createPlugin({
  name: 'In-App Menu',
  restartNeeded: true,
  config: {
    enabled: false,
    hideDOMWindowControls: false,
  } as InAppMenuConfig,
  stylesheets: [titlebarStyle],
  menu: onMenu,

  backend: onMainLoad,
  renderer: {
    start: onRendererLoad,
    onPlayerApiReady,
  },
});

