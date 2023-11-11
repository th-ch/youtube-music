import { createPluginBuilder } from '../utils/builder';

export type DisableAutoPlayPluginConfig = {
  enabled: boolean;
  applyOnce: boolean;
}

const builder = createPluginBuilder('disable-autoplay', {
  name: 'Disable Autoplay',
  restartNeeded: false,
  config: {
    enabled: false,
    applyOnce: false,
  } as DisableAutoPlayPluginConfig,
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
