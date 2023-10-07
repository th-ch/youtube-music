import prompt, { KeybindOptions } from 'custom-electron-prompt';

import { BrowserWindow, MenuItem } from 'electron';

import { enabled } from './back';

import { setMenuOptions } from '../../config/plugins';
import promptOptions from '../../providers/prompt-options';
import { MenuTemplate } from '../../menu';

import type { ConfigType } from '../../config/dynamic';

function changeOptions(changedOptions: Partial<ConfigType<'precise-volume'>>, options: ConfigType<'precise-volume'>, win: BrowserWindow) {
  for (const option in changedOptions) {
    // HACK: Weird TypeScript error
    (options as Record<string, unknown>)[option] = (changedOptions as Record<string, unknown>)[option];
  }
  // Dynamically change setting if plugin is enabled
  if (enabled()) {
    win.webContents.send('setOptions', changedOptions);
  } else { // Fallback to usual method if disabled
    setMenuOptions('precise-volume', options);
  }
}

export default (win: BrowserWindow, options: ConfigType<'precise-volume'>): MenuTemplate => [
  {
    label: 'Local Arrowkeys Controls',
    type: 'checkbox',
    checked: Boolean(options.arrowsShortcut),
    click(item) {
      changeOptions({ arrowsShortcut: item.checked }, options, win);
    },
  },
  {
    label: 'Global Hotkeys',
    type: 'checkbox',
    checked: Boolean(options.globalShortcuts?.volumeUp ?? options.globalShortcuts?.volumeDown),
    click: (item) => promptGlobalShortcuts(win, options, item),
  },
  {
    label: 'Set Custom Volume Steps',
    click: () => promptVolumeSteps(win, options),
  },
];

// Helper function for globalShortcuts prompt
const kb = (label_: string, value_: string, default_: string): KeybindOptions => ({ 'value': value_, 'label': label_, 'default': default_ || undefined });

async function promptVolumeSteps(win: BrowserWindow, options: ConfigType<'precise-volume'>) {
  const output = await prompt({
    title: 'Volume Steps',
    label: 'Choose Volume Increase/Decrease Steps',
    value: options.steps || 1,
    type: 'counter',
    counterOptions: { minimum: 0, maximum: 100, multiFire: true },
    width: 380,
    ...promptOptions(),
  }, win);

  if (output || output === 0) { // 0 is somewhat valid
    changeOptions({ steps: output }, options, win);
  }
}

async function promptGlobalShortcuts(win: BrowserWindow, options: ConfigType<'precise-volume'>, item: MenuItem) {
  const output = await prompt({
    title: 'Global Volume Keybinds',
    label: 'Choose Global Volume Keybinds:',
    type: 'keybind',
    keybindOptions: [
      kb('Increase Volume', 'volumeUp', options.globalShortcuts?.volumeUp),
      kb('Decrease Volume', 'volumeDown', options.globalShortcuts?.volumeDown),
    ],
    ...promptOptions(),
  }, win);

  if (output) {
    const newGlobalShortcuts: {
      volumeUp: string;
      volumeDown: string;
    } = { volumeUp: '', volumeDown: '' };
    for (const { value, accelerator } of output) {
      newGlobalShortcuts[value as keyof typeof newGlobalShortcuts] = accelerator;
    }

    changeOptions({ globalShortcuts: newGlobalShortcuts }, options, win);

    item.checked = Boolean(options.globalShortcuts.volumeUp) || Boolean(options.globalShortcuts.volumeDown);
  } else {
    // Reset checkbox if prompt was canceled
    item.checked = !item.checked;
  }
}
