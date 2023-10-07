import config from './config';
import inject from './inject';
import injectCliqzPreload from './inject-cliqz-preload';

import { blockers } from './blocker-types';

export default async () => {
  if (await config.shouldUseBlocklists()) {
    // Preload adblocker to inject scripts/styles
    injectCliqzPreload();
    // eslint-disable-next-line @typescript-eslint/await-thenable
  } else if ((await config.get('blocker')) === blockers.InPlayer) {
    inject();
  }
};
