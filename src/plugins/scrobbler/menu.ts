import prompt from 'custom-electron-prompt';

import { BrowserWindow } from 'electron';

import { t } from '@/i18n';
import promptOptions from '@/providers/prompt-options';

import { ScrobblerPluginConfig } from './index';
import { SetConfType, backend } from './main';

import type { MenuContext } from '@/types/contexts';
import type { MenuTemplate } from '@/menu';

async function promptLastFmOptions(
  options: ScrobblerPluginConfig,
  setConfig: SetConfType,
  window: BrowserWindow,
) {
  const output = await prompt(
    {
      title: t('plugins.scrobbler.menu.lastfm.api-settings'),
      label: t('plugins.scrobbler.menu.lastfm.api-settings'),
      type: 'multiInput',
      multiInputOptions: [
        {
          label: t('plugins.scrobbler.prompt.lastfm.api-key'),
          value: options.scrobblers.lastfm?.apiKey,
          inputAttrs: {
            type: 'text',
          },
        },
        {
          label: t('plugins.scrobbler.prompt.lastfm.api-secret'),
          value: options.scrobblers.lastfm?.secret,
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
      options.scrobblers.lastfm.apiKey = output[0];
    }

    if (output[1]) {
      options.scrobblers.lastfm.secret = output[1];
    }

    setConfig(options);
  }
}

async function promptListenbrainzOptions(
  options: ScrobblerPluginConfig,
  setConfig: SetConfType,
  window: BrowserWindow,
) {
  const output = await prompt(
    {
      title: t('plugins.scrobbler.prompt.listenbrainz.token.title'),
      label: t('plugins.scrobbler.prompt.listenbrainz.token.label'),
      type: 'input',
      value: options.scrobblers.listenbrainz?.token,
      ...promptOptions(),
    },
    window,
  );

  if (output) {
    options.scrobblers.listenbrainz.token = output;
    setConfig(options);
  }
}

async function promptSlackOptions(
  options: ScrobblerPluginConfig,
  setConfig: SetConfType,
  window: BrowserWindow,
) {
  const output = await prompt(
    {
      title: 'Slack Settings',
      label: 'Slack Settings',
      type: 'multiInput',
      multiInputOptions: [
        {
          label: 'Slack OAuth Token',
          value: options.scrobblers.slack?.token,
          inputAttrs: {
            type: 'text',
          },
        },
        {
          label: 'Slack Cookie Token (d cookie value)',
          value: options.scrobblers.slack?.cookieToken,
          inputAttrs: {
            type: 'text',
          },
        },
        {
          label: 'Emoji Name (for album art upload)',
          value: options.scrobblers.slack?.emojiName,
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
      options.scrobblers.slack.token = output[0];
    }

    if (output[1]) {
      options.scrobblers.slack.cookieToken = output[1];
    }

    if (output[2]) {
      options.scrobblers.slack.emojiName = output[2];
    }

    setConfig(options);
  }
}

export const onMenu = async ({
  window,
  getConfig,
  setConfig,
}: MenuContext<ScrobblerPluginConfig>): Promise<MenuTemplate> => {
  const config = await getConfig();

  return [
    {
      label: t('plugins.scrobbler.menu.scrobble-other-media'),
      type: 'checkbox',
      checked: Boolean(config.scrobbleOtherMedia),
      click(item) {
        config.scrobbleOtherMedia = item.checked;
        setConfig(config);
      },
    },
    {
      label: t('plugins.scrobbler.menu.scrobble-alternative-title'),
      type: 'checkbox',
      checked: Boolean(config.alternativeTitles),
      click(item) {
        config.alternativeTitles = item.checked;
        setConfig(config);
      },
    },
    {
      label: 'Last.fm',
      submenu: [
        {
          label: t('main.menu.plugins.enabled'),
          type: 'checkbox',
          checked: Boolean(config.scrobblers.lastfm?.enabled),
          click(item) {
            backend.toggleScrobblers(config, window);
            config.scrobblers.lastfm.enabled = item.checked;
            setConfig(config);
          },
        },
        {
          label: t('plugins.scrobbler.menu.lastfm.api-settings'),
          click() {
            promptLastFmOptions(config, setConfig, window);
          },
        },
      ],
    },
    {
      label: 'ListenBrainz',
      submenu: [
        {
          label: t('main.menu.plugins.enabled'),
          type: 'checkbox',
          checked: Boolean(config.scrobblers.listenbrainz?.enabled),
          click(item) {
            backend.toggleScrobblers(config, window);
            config.scrobblers.listenbrainz.enabled = item.checked;
            setConfig(config);
          },
        },
        {
          label: t('plugins.scrobbler.menu.listenbrainz.token'),
          click() {
            promptListenbrainzOptions(config, setConfig, window);
          },
        },
      ],
    },
    {
      label: 'Slack',
      submenu: [
        {
          label: t('main.menu.plugins.enabled'),
          type: 'checkbox',
          checked: Boolean(config.scrobblers.slack?.enabled),
          click(item) {
            backend.toggleScrobblers(config, window);
            config.scrobblers.slack.enabled = item.checked;
            setConfig(config);
          },
        },
        {
          label: 'Slack Settings',
          click() {
            promptSlackOptions(config, setConfig, window);
          },
        },
      ],
    },
  ];
};
