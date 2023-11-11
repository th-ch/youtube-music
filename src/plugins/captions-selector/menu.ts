import builder from './index';

import type { MenuTemplate } from '../../menu';

export default builder.createMenu(async ({ getConfig, setConfig }): Promise<MenuTemplate> => {
  const config = await getConfig();

  return [
    {
      label: 'Automatically select last used caption',
      type: 'checkbox',
      checked: config.autoload,
      click(item) {
        setConfig({ autoload: item.checked });
      },
    },
    {
      label: 'No captions by default',
      type: 'checkbox',
      checked: config.disableCaptions,
      click(item) {
        setConfig({ disableCaptions: item.checked });
      },
    },
  ];
});
