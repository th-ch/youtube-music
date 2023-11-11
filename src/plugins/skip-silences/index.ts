import { createPluginBuilder } from '../utils/builder';

export type SkipSilencesPluginConfig = {
  enabled: boolean;
  onlySkipBeginning: boolean;
};

const builder = createPluginBuilder('skip-silences', {
  name: 'Skip Silences',
  restartNeeded: true,
  config: {
    enabled: false,
    onlySkipBeginning: false,
  } as SkipSilencesPluginConfig,
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
