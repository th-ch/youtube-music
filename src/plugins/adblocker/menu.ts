import { blockers } from './types';
import builder from './index';

import type { MenuTemplate } from '../../menu';

export default builder.createMenu(async ({ getConfig, setConfig }): Promise<MenuTemplate> => {
  const config = await getConfig();

  return [
    {
      label: 'Blocker',
      submenu: Object.values(blockers).map((blocker) => ({
        label: blocker,
        type: 'radio',
        checked: (config.blocker || blockers.WithBlocklists) === blocker,
        click() {
          setConfig({ blocker });
        },
      })),
    },
  ];
});
