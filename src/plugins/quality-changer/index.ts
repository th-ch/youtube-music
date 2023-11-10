import { createPluginBuilder } from '../utils/builder';

const builder = createPluginBuilder('quality-changer', {
  name: 'Quality Changer',
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
