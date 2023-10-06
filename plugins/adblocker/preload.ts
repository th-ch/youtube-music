import config from './config';

export default async () => {
  if (await config.shouldUseBlocklists()) {
    // Preload adblocker to inject scripts/styles
    require('@cliqz/adblocker-electron-preload');
    // eslint-disable-next-line @typescript-eslint/await-thenable
  } else if ((await config.get('blocker')) === config.blockers.InPlayer) {
    require('./inject.js');
  }
};
