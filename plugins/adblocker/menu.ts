import config from './config';

export default async () => {
  const blockerConfig = await config.get('blocker');

  return [
    {
      label: 'Blocker',
      submenu: Object.values(config.blockers).map((blocker) => ({
        label: blocker,
        type: 'radio',
        checked: (blockerConfig || config.blockers.WithBlocklists) === blocker,
        click() {
          config.set('blocker', blocker);
        },
      })),
    },
  ];
};
