import { createPluginBuilder } from '../utils/builder';

const builder = createPluginBuilder('compact-sidebar', {
  name: 'Compact Sidebar',
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
