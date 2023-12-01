import { createPlugin } from '@/utils';
import style from './style.css?inline';
import { t } from '@/i18n';

export default createPlugin({
  name: () => t('plugins.blur-nav-bar.name'),
  description: () => t('plugins.blur-nav-bar.description'),
  restartNeeded: true,
  stylesheets: [style],
  renderer() {},
});
