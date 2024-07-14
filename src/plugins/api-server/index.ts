import { createPlugin } from '@/utils';
import { t } from '@/i18n';

import { defaultAPIServerConfig } from './config';
import { onMenu } from './menu';
import { backend } from './backend';

export default createPlugin({
  name: () => t('plugins.api-server.name'),
  description: () => t('plugins.api-server.description'),
  restartNeeded: false,
  config: defaultAPIServerConfig,
  addedVersion: '3.4.X',
  menu: onMenu,


  renderer: {
    onPlayerApiReady(api,{setConfig}) {
      setConfig({volume: api.getVolume()})
    }
  },

  backend,
});
