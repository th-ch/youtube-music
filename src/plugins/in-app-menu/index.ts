import titlebarStyle from './titlebar.css?inline';

import { createPluginBuilder } from '../utils/builder';

const builder = createPluginBuilder('in-app-menu', {
  name: 'In-App Menu',
  restartNeeded: true,
  config: {
    enabled: false,
    hideDOMWindowControls: false,
  },
  styles: [titlebarStyle],
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
