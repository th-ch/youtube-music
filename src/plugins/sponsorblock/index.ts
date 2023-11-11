import { createPluginBuilder } from '../utils/builder';

export type SponsorBlockPluginConfig = {
  enabled: boolean;
  apiURL: string;
  categories: ('sponsor' | 'intro' | 'outro' | 'interaction' | 'selfpromo' | 'music_offtopic')[];
};

const builder = createPluginBuilder('sponsorblock', {
  name: 'SponsorBlock',
  restartNeeded: true,
  config: {
    enabled: false,
    apiURL: 'https://sponsor.ajay.app',
    categories: [
      'sponsor',
      'intro',
      'outro',
      'interaction',
      'selfpromo',
      'music_offtopic',
    ],
  } as SponsorBlockPluginConfig,
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
