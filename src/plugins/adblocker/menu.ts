import config, { blockers } from './config';

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
