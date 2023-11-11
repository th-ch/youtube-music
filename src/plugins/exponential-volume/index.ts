import { createPluginBuilder } from '../utils/builder';

const builder = createPluginBuilder('exponential-volume', {
  name: 'Exponential Volume',
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
