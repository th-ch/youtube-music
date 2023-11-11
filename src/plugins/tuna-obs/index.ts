import { createPluginBuilder } from '../utils/builder';

const builder = createPluginBuilder('tuna-obs', {
  name: 'Tuna OBS',
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
