import style from './style.css?inline';

import globalConfig from '@/config';
import { t } from '@/i18n';
import { createPlugin } from '@/utils';
import { ipcMain } from 'electron';
import type { TransparentPlayerConfig } from './types';

const defaultConfig: TransparentPlayerConfig = {
  enabled: false,
  opacity: 0.5,
  type: "acrylic"
}

const opacityList = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const typeList = ['acrylic', 'mica', 'tabbed'] as Array<TransparentPlayerConfig['type']>;

export default createPlugin({
  name: () => t('plugins.transparent-player.name'),
  description: () => t('plugins.transparent-player.description'),
  addedVersion: '3.9.x',
  restartNeeded: true,
  config: defaultConfig,
  stylesheets: [style],
  async menu({ getConfig, setConfig }) {
    const config = await getConfig();
    return [
      {
        label: t('plugins.transparent-player.menu.opacity.label'),
        submenu: opacityList.map((opacity) => ({
          label: t('plugins.transparent-player.menu.opacity.submenu.percent', {opacity: opacity * 100}),
          type: 'radio',
          checked: config.opacity === opacity,
          click() {
            setConfig({ opacity });
          },
        }))
      },
      {
        label: t('plugins.transparent-player.menu.type.label'),
        submenu: typeList.map((type) => ({
          label: t(`plugins.transparent-player.menu.type.submenu.${type}`),
          type: 'radio',
          checked: config.type === type,
          click() {
            setConfig({ type });
            ipcMain.emit('transparent-player:type-changed', { type });
          }
        }))
      }
    ];
  },
  backend: {
    async start({ window, getConfig }) {
      const config = await getConfig();
      window.setBackgroundMaterial?.(config.type);
      globalConfig.set('options.backgroundMaterial', config.type);

      ipcMain.on('transparent-player:type-changed', (event) => {
        window.setBackgroundMaterial?.(event.type as TransparentPlayerConfig['type']);
        globalConfig.set('options.backgroundMaterial', event.type);
      });
    },
    stop({ window }) {
      window.setBackgroundMaterial?.('none');
      globalConfig.set('options.backgroundMaterial', undefined);
    }
  },
  renderer: {
    props: {
      enabled: defaultConfig.enabled,
      opacity: defaultConfig.opacity,
      type: defaultConfig.type,
    } as TransparentPlayerConfig,
    async start({getConfig}) {
      const config = await getConfig();
      this.props = config;
      if (config.enabled) {
        document.body.classList.add('transparent-player');
        this.applyVariables();
      }
    },
    onConfigChange(newConfig) {
      this.props = newConfig;
      this.applyVariables();
    },
    stop() {
      document.body.classList.remove('transparent-player');
      document.documentElement.style.removeProperty('--transparent-player-opacity');
    },
    applyVariables(this: { props: TransparentPlayerConfig }) {
      const { opacity } = this.props;
      document.documentElement.style.setProperty('--transparent-player-opacity', opacity.toString());
    }
  }
});
