import prompt, { KeybindOptions } from 'custom-electron-prompt';

import { BrowserWindow } from 'electron';

import { setMenuOptions } from '../../config/plugins';


import promptOptions from '../../providers/prompt-options';
import { MenuTemplate } from '../../menu';

import type { ConfigType } from '../../config/dynamic';

export default (win: BrowserWindow, options: ConfigType<'shortcuts'>): MenuTemplate => [
  {
    label: 'Set Global Song Controls',
    click: () => promptKeybind(options, win),
  },
  {
    label: 'Override MediaKeys',
    type: 'checkbox',
    checked: options.overrideMediaKeys,
    click: (item) => setOption(options, 'overrideMediaKeys', item.checked),
  },
];

function setOption<Key extends keyof ConfigType<'shortcuts'> = keyof ConfigType<'shortcuts'>>(
  options: ConfigType<'shortcuts'>,
  key: Key | null = null,
  newValue: ConfigType<'shortcuts'>[Key] | null = null,
) {
  if (key && newValue !== null) {
    options[key] = newValue;
  }

  setMenuOptions('shortcuts', options);
}

// Helper function for keybind prompt
const kb = (label_: string, value_: string, default_: string): KeybindOptions => ({ value: value_, label: label_, default: default_ });

async function promptKeybind(options: ConfigType<'shortcuts'>, win: BrowserWindow) {
  const output = await prompt({
    title: 'Global Keybinds',
    label: 'Choose Global Keybinds for Songs Control:',
    type: 'keybind',
    keybindOptions: [ // If default=undefined then no default is used
      kb('Previous', 'previous', options.global?.previous),
      kb('Play / Pause', 'playPause', options.global?.playPause),
      kb('Next', 'next', options.global?.next),
    ],
    height: 270,
    ...promptOptions(),
  }, win);

  if (output) {
    if (!options.global) {
      options.global = {};
    }

    for (const { value, accelerator } of output) {
      options.global[value] = accelerator;
    }

    setOption(options);
  }
  // Else -> pressed cancel
}
