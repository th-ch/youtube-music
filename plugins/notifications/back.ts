import { BrowserWindow, Notification } from 'electron';

import is from 'electron-is';

import { notificationImage } from './utils';
import config from './config';
import interactive from './interactive';

import registerCallback, { SongInfo } from '../../providers/song-info';

import type { ConfigType } from '../../config/dynamic';

type NotificationOptions = ConfigType<'notifications'>;

const notify = (info: SongInfo) => {
  // Send the notification
  const currentNotification = new Notification({
    title: info.title || 'Playing',
    body: info.artist,
    icon: notificationImage(info),
    silent: true,
    urgency: config.get('urgency') as 'normal' | 'critical' | 'low',
  });
  currentNotification.show();

  return currentNotification;
};

const setup = () => {
  let oldNotification: Notification;
  let currentUrl: string | undefined;

  registerCallback((songInfo: SongInfo) => {
    if (!songInfo.isPaused && (songInfo.url !== currentUrl || config.get('unpauseNotification'))) {
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

export default (win: BrowserWindow, options: NotificationOptions) => {
  // Register the callback for new song information
  is.windows() && options.interactive
    ? interactive(win)
    : setup();
};
