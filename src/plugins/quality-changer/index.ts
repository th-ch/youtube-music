import { createPluginBuilder } from '../utils/builder';

const builder = createPluginBuilder('quality-changer', {
  name: 'Video Quality Changer',
  restartNeeded: false,
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
