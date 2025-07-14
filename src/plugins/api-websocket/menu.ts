import { MenuContext } from '@/types/contexts';
import { APIWebsocketConfig, defaultAPIWebsocketConfig } from './config';
import { MenuTemplate } from '@/menu';
import prompt from 'custom-electron-prompt';
import promptOptions from '@/providers/prompt-options';

export const onMenu = async ({
  getConfig,
  setConfig,
  window,
}: MenuContext<APIWebsocketConfig>): Promise<MenuTemplate> => {
  return [
    {
      label: 'Hostname',
      type: 'normal',
      async click() {
        const config = await getConfig();

        const newHostname =
          (await prompt(
            {
              title: 'Hostname',
              label: 'New hostname',
              value: config.hostname,
              type: 'input',
              width: 380,
              ...promptOptions(),
            },
            window,
          )) ??
          config.hostname ??
          defaultAPIWebsocketConfig.hostname;

        setConfig({ ...config, hostname: newHostname });
      },
    },
    {
      label: 'Port',
      type: 'normal',
      async click() {
        const config = await getConfig();

        const newPort =
          (await prompt(
            {
              title: 'Port',
              label: 'New port',
              value: config.port,
              type: 'counter',
              counterOptions: { minimum: 0, maximum: 65565 },
              width: 380,
              ...promptOptions(),
            },
            window,
          )) ??
          config.port ??
          defaultAPIWebsocketConfig.port;

        setConfig({ ...config, port: newPort });
      },
    },
  ];
};
