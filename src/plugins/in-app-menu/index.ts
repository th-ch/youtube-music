import titlebarStyle from './titlebar.css?inline';
import { createPlugin } from '@/utils';
import { onMainLoad } from '@/plugins/in-app-menu/main';
import { onMenu } from '@/plugins/in-app-menu/menu';
import { onPlayerApiReady, onRendererLoad } from '@/plugins/in-app-menu/renderer';

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

