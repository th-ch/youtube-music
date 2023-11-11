import { blockers } from './types';

import { createPluginBuilder } from '../utils/builder';

interface AdblockerConfig {
  /**
   * Whether to enable the adblocker.
   * @default true
   */
  enabled: boolean;
  /**
   * When enabled, the adblocker will cache the blocklists.
   * @default true
   */
  cache: boolean;
  /**
   * Which adblocker to use.
   * @default blockers.InPlayer
   */
  blocker: typeof blockers[keyof typeof blockers];
  /**
   * Additional list of filters to use.
   * @example ["https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt"]
   * @default []
   */
  additionalBlockLists: string[];
  /**
   * Disable the default blocklists.
   * @default false
   */
  disableDefaultLists: boolean;
}

const builder = createPluginBuilder('adblocker', {
  name: 'Adblocker',
  restartNeeded: false,
  config: {
    enabled: true,
    cache: true,
    blocker: blockers.InPlayer,
    additionalBlockLists: [],
    disableDefaultLists: false,
  } as AdblockerConfig,
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
