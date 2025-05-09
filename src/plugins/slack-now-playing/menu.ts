import prompt from 'custom-electron-prompt';
import { BrowserWindow } from 'electron';
import promptOptions from '@/providers/prompt-options';
import { t } from '@/i18n';

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
      title: t('plugins.slack-now-playing.name'),
      label: t('plugins.slack-now-playing.name'),
      type: 'multiInput',
      multiInputOptions: [
        {
          label: t('plugins.slack-now-playing.menu.token'),
          value: options.token,
          inputAttrs: {
            type: 'text',
          },
        },
        {
          label: t('plugins.slack-now-playing.menu.cookie-token'),
          value: options.cookieToken,
          inputAttrs: {
            type: 'text',
          },
        },
        {
          label: t('plugins.slack-now-playing.menu.emoji-name'),
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
      label: t('plugins.slack-now-playing.menu.settings'),
      click() {
        promptSlackNowPlayingOptions(config, setConfig, window);
      },
    },
  ];
};
