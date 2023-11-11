import { createPluginBuilder } from '../utils/builder';

const builder = createPluginBuilder('captions-selector', {
  name: 'Captions Selector',
  restartNeeded: false,
  config: {
    enabled: false,
    disableCaptions: false,
    autoload: false,
    lastCaptionsCode: '',
  },
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
