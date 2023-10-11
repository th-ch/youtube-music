import config, { shouldUseBlocklists } from './config';
import inject from './inject';
import injectCliqzPreload from './inject-cliqz-preload';

import { blockers } from './blocker-types';

export default async () => {
  if (shouldUseBlocklists()) {
    // Preload adblocker to inject scripts/styles
    await injectCliqzPreload();
    // eslint-disable-next-line @typescript-eslint/await-thenable
  } else if ((config.get('blocker')) === blockers.InPlayer) {
    inject();
  }
};
