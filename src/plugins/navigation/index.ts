import style from './style.css?inline';

import { createPluginBuilder } from '../utils/builder';

export const builder = createPluginBuilder('navigation', {
  name: 'Navigation',
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
