import prompt from 'custom-electron-prompt';

import builder from './index';

import promptOptions from '../../providers/prompt-options';


export default builder.createMenu(async ({ window, getConfig, setConfig }) => {
  const config = await getConfig();

  return [
    {
      label: 'Always on top',
      type: 'checkbox',
      checked: config.alwaysOnTop,
      click(item) {
        setConfig({ alwaysOnTop: item.checked });
        window.setAlwaysOnTop(item.checked);
      },
    },
    {
      label: 'Save window position',
      type: 'checkbox',
      checked: config.savePosition,
      click(item) {
        setConfig({ savePosition: item.checked });
      },
    },
    {
      label: 'Save window size',
      type: 'checkbox',
      checked: config.saveSize,
      click(item) {
        setConfig({ saveSize: item.checked });
      },
    },
    {
      label: 'Hotkey',
      type: 'checkbox',
      checked: !!config.hotkey,
      async click(item) {
        const output = await prompt({
          title: 'Picture in Picture Hotkey',
          label: 'Choose a hotkey for toggling Picture in Picture',
          type: 'keybind',
          keybindOptions: [{
            value: 'hotkey',
            label: 'Hotkey',
            default: config.hotkey,
          }],
          ...promptOptions(),
        }, window);

        if (output) {
          const { value, accelerator } = output[0];
          setConfig({ [value]: accelerator });

          item.checked = !!accelerator;
        } else {
          // Reset checkbox if prompt was canceled
          item.checked = !item.checked;
        }
      },
    },
    {
      label: 'Use native PiP',
      type: 'checkbox',
      checked: config.useNativePiP,
      click(item) {
        setConfig({ useNativePiP: item.checked });
      },
    },
  ];
});
