import titlebarStyle from './titlebar.css?inline';
import { createPlugin } from '@/utils';
import { onMainLoad } from './main';
import { onMenu } from './menu';
import { onPlayerApiReady, onRendererLoad } from './renderer';
import { t } from '@/i18n';

export interface InAppMenuConfig {
  enabled: boolean;
  hideDOMWindowControls: boolean;
}
export default createPlugin({
  name: () => t('plugins.in-app-menu.name'),
  description: () => t('plugins.in-app-menu.description'),
  restartNeeded: true,
  config: {
    enabled:
      (typeof window !== 'undefined' &&
        !window.navigator?.userAgent?.includes('mac')) ||
      (typeof global !== 'undefined' && global.process?.platform !== 'darwin'),
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
