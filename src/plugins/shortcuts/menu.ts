import prompt, { KeybindOptions } from 'custom-electron-prompt';

import promptOptions from '@/providers/prompt-options';

import type { ShortcutsPluginConfig } from './index';
import type { BrowserWindow } from 'electron';
import type { MenuContext } from '@/types/contexts';
import type { MenuTemplate } from '@/menu';

export const onMenu = async ({
  window,
  getConfig,
  setConfig,
}: MenuContext<ShortcutsPluginConfig>): Promise<MenuTemplate> => {
  const config = await getConfig();

  /**
   * Helper function for keybind prompt
   */
  const kb = (
    label_: string,
    value_: string,
    default_?: string,
  ): KeybindOptions => ({ value: value_, label: label_, default: default_ });

  async function promptKeybind(
    config: ShortcutsPluginConfig,
    win: BrowserWindow,
  ) {
    const output = await prompt(
      {
        title: 'Global Keybinds',
        label: 'Choose Global Keybinds for Songs Control:',
        type: 'keybind',
        keybindOptions: [
          // If default=undefined then no default is used
          kb('Previous', 'previous', config.global?.previous),
          kb('Play / Pause', 'playPause', config.global?.playPause),
          kb('Next', 'next', config.global?.next),
        ],
        height: 270,
        ...promptOptions(),
      },
      win,
    );

    if (output) {
      const newConfig = { ...config };

      for (const { value, accelerator } of output) {
        newConfig.global[value as keyof ShortcutsPluginConfig['global']] =
          accelerator;
      }

      setConfig(config);
    }
    // Else -> pressed cancel
  }

  return [
    {
      label: 'Set Global Song Controls',
      click: () => promptKeybind(config, window),
    },
    {
      label: 'Override MediaKeys',
      type: 'checkbox',
      checked: config.overrideMediaKeys,
      click: (item) => setConfig({ overrideMediaKeys: item.checked }),
    },
  ];
};
