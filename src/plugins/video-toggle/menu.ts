import builder from './index';

export default builder.createMenu(async ({ getConfig, setConfig }) => {
  const config = await getConfig();

  return [
    {
      label: 'Mode',
      submenu: [
        {
          label: 'Custom toggle',
          type: 'radio',
          checked: config.mode === 'custom',
          click() {
            setConfig({ mode: 'custom' });
          },
        },
        {
          label: 'Native toggle',
          type: 'radio',
          checked: config.mode === 'native',
          click() {
            setConfig({ mode: 'native' });
          },
        },
        {
          label: 'Disabled',
          type: 'radio',
          checked: config.mode === 'disabled',
          click() {
            setConfig({ mode: 'disabled' });
          },
        },
      ],
    },
    {
      label: 'Alignment',
      submenu: [
        {
          label: 'Left',
          type: 'radio',
          checked: config.align === 'left',
          click() {
            setConfig({ align: 'left' });
          },
        },
        {
          label: 'Middle',
          type: 'radio',
          checked: config.align === 'middle',
          click() {
            setConfig({ align: 'middle' });
          },
        },
        {
          label: 'Right',
          type: 'radio',
          checked: config.align === 'right',
          click() {
            setConfig({ align: 'right' });
          },
        },
      ],
    },
    {
      label: 'Force Remove Video Tab',
      type: 'checkbox',
      checked: config.forceHide,
      click(item) {
        setConfig({ forceHide: item.checked });
      },
    },
  ];
});
