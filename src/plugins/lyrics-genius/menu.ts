import builder from './index';

export default builder.createMenu(async ({ getConfig, setConfig }) => {
  const config = await getConfig();

  return [
    {
      label: 'Romanized Lyrics',
      type: 'checkbox',
      checked: config.romanizedLyrics,
      click(item) {
        setConfig({
          romanizedLyrics: item.checked,
        });
      },
    },
  ];
});
