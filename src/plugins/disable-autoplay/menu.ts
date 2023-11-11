import builder from './index';

export default builder.createMenu(async ({ getConfig, setConfig }) => {
  const config = await getConfig();

  return [
    {
      label: 'Applies only on startup',
      type: 'checkbox',
      checked: config.applyOnce,
      async click() {
        const nowConfig = await getConfig();
        setConfig({
          applyOnce: !nowConfig.applyOnce,
        });
      },
    },
  ];
});
