import { createPluginBuilder } from '../utils/builder';

const builder = createPluginBuilder('bypass-age-restrictions', {
  name: 'Bypass Age Restrictions',
  config: {
    enabled: false,
  },
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
