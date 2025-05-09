import prompt from 'custom-electron-prompt';
import { BrowserWindow } from 'electron';
import promptOptions from '@/providers/prompt-options';

import type { SlackNowPlayingConfig } from './main';
import type { MenuContext } from '@/types/contexts';
import type { MenuTemplate } from '@/menu';

/**
 * Prompts user for Slack Now Playing plugin settings
 */
async function promptSlackNowPlayingOptions(
  options: SlackNowPlayingConfig,
  setConfig: (config: SlackNowPlayingConfig) => void,
  window: BrowserWindow,
) {
  const output = await prompt(
    {
      title: 'Slack Now Playing Settings',
      label: 'Slack Now Playing Settings',
      type: 'multiInput',
      multiInputOptions: [
        {
          label: 'Slack OAuth Token',
          value: options.token,
          inputAttrs: {
            type: 'text',
          },
        },
        {
          label: 'Slack Cookie Token (d cookie value)',
          value: options.cookieToken,
          inputAttrs: {
            type: 'text',
          },
        },
        {
          label: 'Emoji Name (for album art upload)',
          value: options.emojiName,
          inputAttrs: {
            type: 'text',
          },
        },
      ],
      resizable: true,
      height: 360,
      ...promptOptions(),
    },
    window,
  );

  if (output) {
    if (output[0]) {
      options.token = output[0];
    }
    if (output[1]) {
      options.cookieToken = output[1];
    }
    if (output[2]) {
      options.emojiName = output[2];
    }
    setConfig(options);
  }
}

export const onMenu = async ({
  window,
  getConfig,
  setConfig,
}: MenuContext<SlackNowPlayingConfig>): Promise<MenuTemplate> => {
  const config = await getConfig();
  return [
    {
      label: 'Settings',
      click() {
        promptSlackNowPlayingOptions(config, setConfig, window);
      },
    },
  ];
};
