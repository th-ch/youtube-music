import { inject } from 'simple-youtube-age-restriction-bypass';

import { createPlugin } from '@/utils';
import { t } from '@/i18n';

export default createPlugin({
  name: () => t('plugins.bypass-age-restrictions.name'),
  description: () => t('plugins.bypass-age-restrictions.description'),
  restartNeeded: true,

  // See https://github.com/organization/Simple-YouTube-Age-Restriction-Bypass#userscript
  renderer: () => inject(),
});
