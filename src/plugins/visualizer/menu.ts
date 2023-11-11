import builder from './index';

const visualizerTypes = ['butterchurn', 'vudio', 'wave'] as const; // For bundling

export default builder.createMenu(async ({ getConfig, setConfig }) => {
  const config = await getConfig();

  return [
    {
      label: 'Type',
      submenu: visualizerTypes.map((visualizerType) => ({
        label: visualizerType,
        type: 'radio',
        checked: config.type === visualizerType,
        click() {
          setConfig({ type: visualizerType });
        },
      })),
    },
  ];
});
