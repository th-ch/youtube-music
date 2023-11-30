import { createPlugin } from '@/utils';
import { backend } from './main';
import { onMenu } from './menu';

export type DiscordPluginConfig = {
  enabled: boolean;
  /**
   * If enabled, will try to reconnect to discord every 5 seconds after disconnecting or failing to connect
   *
   * @default true
   */
  autoReconnect: boolean;
  /**
   * If enabled, the discord rich presence gets cleared when music paused after the time specified below
   */
  activityTimoutEnabled: boolean;
  /**
   * The time in milliseconds after which the discord rich presence gets cleared when music paused
   *
   * @default 10 * 60 * 1000 (10 minutes)
   */
  activityTimoutTime: number;
  /**
   * Add a "Play on YouTube Music" button to rich presence
   */
  playOnYouTubeMusic: boolean;
  /**
   * Hide the "View App On GitHub" button in the rich presence
   */
  hideGitHubButton: boolean;
  /**
   * Hide the "duration left" in the rich presence
   */
  hideDurationLeft: boolean;
}

export default createPlugin({
  name: 'Discord Rich Presence',
  restartNeeded: false,
  config: {
    enabled: false,
    autoReconnect: true,
    activityTimoutEnabled: true,
    activityTimoutTime: 10 * 60 * 1000,
    playOnYouTubeMusic: true,
    hideGitHubButton: false,
    hideDurationLeft: false,
  } as DiscordPluginConfig,
  menu: onMenu,
  backend,
});

