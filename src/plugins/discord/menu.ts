import prompt from 'custom-electron-prompt';

import { clear, connect, isConnected, registerRefresh } from './back';

import { setMenuOptions } from '../../config/plugins';
import promptOptions from '../../providers/prompt-options';
import { singleton } from '../../providers/decorators';
import { MenuTemplate } from '../../menu';

import type { ConfigType } from '../../config/dynamic';

const registerRefreshOnce = singleton((refreshMenu: () => void) => {
  registerRefresh(refreshMenu);
});

type DiscordOptions = ConfigType<'discord'>;

export default (win: Electron.BrowserWindow, options: DiscordOptions, refreshMenu: () => void): MenuTemplate => {
  registerRefreshOnce(refreshMenu);

  return [
    {
      label: isConnected() ? 'Connected' : 'Reconnect',
      enabled: !isConnected(),
      click: () => connect(),
    },
    {
      label: 'Auto reconnect',
      type: 'checkbox',
      checked: options.autoReconnect,
      click(item: Electron.MenuItem) {
        options.autoReconnect = item.checked;
        setMenuOptions('discord', options);
      },
    },
    {
      label: 'Clear activity',
      click: clear,
    },
    {
      label: 'Clear activity after timeout',
      type: 'checkbox',
      checked: options.activityTimoutEnabled,
      click(item: Electron.MenuItem) {
        options.activityTimoutEnabled = item.checked;
        setMenuOptions('discord', options);
      },
    },
    {
      label: 'Play on YouTube Music',
      type: 'checkbox',
      checked: options.playOnYouTubeMusic,
      click(item: Electron.MenuItem) {
        options.playOnYouTubeMusic = item.checked;
        setMenuOptions('discord', options);
      },
    },
    {
      label: 'Hide GitHub link Button',
      type: 'checkbox',
      checked: options.hideGitHubButton,
      click(item: Electron.MenuItem) {
        options.hideGitHubButton = item.checked;
        setMenuOptions('discord', options);
      },
    },
    {
      label: 'Hide duration left',
      type: 'checkbox',
      checked: options.hideDurationLeft,
      click(item: Electron.MenuItem) {
        options.hideDurationLeft = item.checked;
        setMenuOptions('discord', options);
      },
    },
    {
      label: 'Set inactivity timeout',
      click: () => setInactivityTimeout(win, options),
    },
  ];
};

async function setInactivityTimeout(win: Electron.BrowserWindow, options: DiscordOptions) {
  const output = await prompt({
    title: 'Set Inactivity Timeout',
    label: 'Enter inactivity timeout in seconds:',
    value: String(Math.round((options.activityTimoutTime ?? 0) / 1e3)),
    type: 'counter',
    counterOptions: { minimum: 0, multiFire: true },
    width: 450,
    ...promptOptions(),
  }, win);

  if (output) {
    options.activityTimoutTime = Math.round(~~output * 1e3);
    setMenuOptions('discord', options);
  }
}
