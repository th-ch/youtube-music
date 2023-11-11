import { Notification } from 'electron';

import is from 'electron-is';

import { notificationImage } from './utils';
import interactive from './interactive';

import builder, { NotificationsPluginConfig } from './index';

import registerCallback, { SongInfo } from '../../providers/song-info';

let config: NotificationsPluginConfig = builder.config;

const notify = (info: SongInfo) => {
  // Send the notification
  const currentNotification = new Notification({
    title: info.title || 'Playing',
    body: info.artist,
    icon: notificationImage(info, config),
    silent: true,
    urgency: config.urgency,
  });
  currentNotification.show();

  return currentNotification;
};

const setup = () => {
  let oldNotification: Notification;
  let currentUrl: string | undefined;

  registerCallback((songInfo: SongInfo) => {
    if (!songInfo.isPaused && (songInfo.url !== currentUrl || config.unpauseNotification)) {
      // Close the old notification
      oldNotification?.close();
      currentUrl = songInfo.url;
      // This fixes a weird bug that would cause the notification to be updated instead of showing
      setTimeout(() => {
        oldNotification = notify(songInfo);
      }, 10);
    }
  });
};

export default builder.createMain((context) => {
  return {
    async onLoad(win) {
      config = await context.getConfig();

      // Register the callback for new song information
      if (is.windows() && config.interactive) interactive(win, () => config, context);
      else setup();
    },
    onConfigChange(newConfig) {
      config = newConfig;
    }
  };
});
