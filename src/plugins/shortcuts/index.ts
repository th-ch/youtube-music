import { createPlugin } from '@/utils';
import { onMainLoad } from './main';
import { onMenu } from './menu';

export type ShortcutMappingType = {
  previous: string;
  playPause: string;
  next: string;
};
export type ShortcutsPluginConfig = {
  enabled: boolean;
  overrideMediaKeys: boolean;
  global: ShortcutMappingType;
  local: ShortcutMappingType;
};

export default createPlugin({
  name: 'Shortcuts (& MPRIS)',
  description:
    'Allows setting global hotkeys for playback (play/pause/next/previous) + disable media osd by overriding media keys + enable Ctrl/CMD + F to search + enable linux mpris support for mediakeys + custom hotkeys for advanced users',
  restartNeeded: true,
  config: {
    enabled: false,
    overrideMediaKeys: false,
    global: {
      previous: '',
      playPause: '',
      next: '',
    },
    local: {
      previous: '',
      playPause: '',
      next: '',
    },
  } as ShortcutsPluginConfig,
  menu: onMenu,

  backend: onMainLoad,
});
