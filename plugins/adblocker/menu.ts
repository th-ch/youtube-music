import config from './config';

import { blockers } from './blocker-types';

import { MenuTemplate } from '../../menu';

export default (): MenuTemplate => {
  return [
    {
      label: 'Blocker',
      submenu: Object.values(blockers).map((blocker: string) => ({
        label: blocker,
        type: 'radio',
        checked: (config.get('blocker') || blockers.WithBlocklists) === blocker,
        click() {
          config.set('blocker', blocker);
        },
      })),
    },
  ];
};
