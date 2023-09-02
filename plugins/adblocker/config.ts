import { PluginConfig } from '../../config/dynamic';

const config = new PluginConfig('adblocker', { enableFront: true });

export const blockers = {
  WithBlocklists: 'With blocklists',
  InPlayer: 'In player',
};

export const shouldUseBlocklists = async () => await config.get('blocker') !== blockers.InPlayer;

export default {
  shouldUseBlocklists,
  blockers,
  get: config.get.bind(this),
  set: config.set.bind(this),
};
