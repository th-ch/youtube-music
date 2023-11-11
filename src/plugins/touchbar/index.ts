import { createPluginBuilder } from '../utils/builder';

const builder = createPluginBuilder('touchbar', {
  name: 'TouchBar',
  restartNeeded: true,
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
