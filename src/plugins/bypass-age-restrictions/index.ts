import { createPlugin } from '@/utils';

export default createPlugin({
  name: 'Bypass Age Restrictions',
  description: "bypass YouTube's age verification",
  restartNeeded: true,

  // See https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass#userscript
  renderer: () => import('simple-youtube-age-restriction-bypass'),
});
