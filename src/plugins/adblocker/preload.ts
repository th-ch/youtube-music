import { inject, isInjected } from './injectors/inject';
import injectCliqzPreload from './injectors/inject-cliqz-preload';

import { blockers } from './types';
import builder from './index';

export default builder.createPreload(({ getConfig }) => ({
  async onLoad() {
    const config = await getConfig();

    if (config.blocker === blockers.WithBlocklists) {
      // Preload adblocker to inject scripts/styles
      await injectCliqzPreload();
    } else if (config.blocker === blockers.InPlayer) {
      inject();
    }
  },
  async onConfigChange(newConfig) {
    if (newConfig.blocker === blockers.WithBlocklists) {
      await injectCliqzPreload();
    } else if (newConfig.blocker === blockers.InPlayer) {
      if (!isInjected()) {
        inject();
      }
    }
  }
}));
