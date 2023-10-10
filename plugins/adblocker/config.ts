/* eslint-disable @typescript-eslint/await-thenable */
/* renderer */

import { blockers } from './blocker-types';

import { PluginConfig } from '../../config/dynamic';

const config = new PluginConfig('adblocker', { enableFront: true });

export const shouldUseBlocklists = () => config.get('blocker') !== blockers.InPlayer;

export default Object.assign(config, {
  shouldUseBlocklists,
  blockers,
});
