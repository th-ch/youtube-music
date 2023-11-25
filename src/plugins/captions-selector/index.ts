import prompt from 'custom-electron-prompt';

import promptOptions from '@/providers/prompt-options';
import { createPlugin } from '@/utils';

export default createPlugin({
  name: 'Captions Selector',
  config: {
    disableCaptions: false,
    autoload: false,
    lastCaptionsCode: '',
  },

  menu({ getConfig, setConfig }) {
    const config = getConfig();
    return [
      {
        label: 'Automatically select last used caption',
        type: 'checkbox',
        checked: config.autoload as boolean,
        click(item) {
          setConfig({ autoload: item.checked });
        },
      },
      {
        label: 'No captions by default',
        type: 'checkbox',
        checked: config.disableCaptions as boolean,
        click(item) {
          setConfig({ disableCaptions: item.checked });
        },
      },
    ];
  },

  backend({ ipc: { handle }, win }) {
    handle(
      'captionsSelector',
      async (_, captionLabels: Record<string, string>, currentIndex: string) =>
        await prompt(
          {
            title: 'Choose Caption',
            label: `Current Caption: ${captionLabels[currentIndex] || 'None'}`,
            type: 'select',
            value: currentIndex,
            selectOptions: captionLabels,
            resizable: true,
            ...promptOptions(),
          },
          win,
        ),
    );
  },
});
