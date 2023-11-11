import style from './style.css?inline';

import { createPluginBuilder } from '../utils/builder';

const builder = createPluginBuilder('navigation', {
  name: 'Navigation',
  restartNeeded: true,
  config: {
    enabled: false,
  },
  styles: [style],
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
