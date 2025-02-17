import { t } from '@/i18n';
import { createPlugin } from '@/utils';

import { onMainLoad } from './backend';
import { onRendererLoad } from './src';

export default createPlugin({
  name: () => t('plugins.music-together.name'),
  description: () => t('plugins.music-together.description'),
  restartNeeded: false,
  addedVersion: '3.2.X',
  config: {
    enabled: false,
  },
  stylesheets: [],
  backend: onMainLoad,
  renderer: {
    start: onRendererLoad,
  },
});
