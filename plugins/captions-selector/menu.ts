import config from './config';

import { MenuTemplate } from '../../menu';

export default (): MenuTemplate => [
  {
    label: 'Automatically select last used caption',
    type: 'checkbox',
    checked: config.get('autoload'),
    click(item) {
      config.set('autoload', item.checked);
    },
  },
  {
    label: 'No captions by default',
    type: 'checkbox',
    checked: config.get('disableCaptions'),
    click(item) {
      config.set('disableCaptions', item.checked);
    },
  },
];
