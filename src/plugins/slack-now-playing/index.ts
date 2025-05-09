import { createPlugin } from '@/utils';
import { onMenu } from './menu';
import { backend, SlackNowPlayingConfig } from './main';

export default createPlugin({
  name: () => 'Slack Now Playing',
  description: () => 'Sets your Slack status to the currently playing song.',
  restartNeeded: true,
  config: {
    enabled: false,
    token: '',
    cookieToken: '',
    emojiName: 'my-album-art',
  } as SlackNowPlayingConfig,
  menu: onMenu,
  backend,
});
