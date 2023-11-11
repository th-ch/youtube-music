import is from 'electron-is';

import builder from './index';

import { setMenuOptions } from '../../config/plugins';

export default builder.createMenu(async ({ getConfig }) => {
  const config = await getConfig();

  if (is.linux()) {
    return [
      {
        label: 'Hide DOM Window Controls',
        type: 'checkbox',
        checked: config.hideDOMWindowControls,
        click(item) {
          config.hideDOMWindowControls = item.checked;
          setMenuOptions('in-app-menu', config);
        }
      }
    ];
  }

  return [];
});
