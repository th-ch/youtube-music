import { createPluginBuilder } from '../utils/builder';

export interface NotificationsPluginConfig {
  enabled: boolean;
  unpauseNotification: boolean;
  urgency: 'low' | 'normal' | 'critical';
  interactive: boolean;
  toastStyle: number;
  refreshOnPlayPause: boolean;
  trayControls: boolean;
  hideButtonText: boolean;
}

const builder = createPluginBuilder('notifications', {
  name: 'Notifications',
  restartNeeded: true,
  config: {
    enabled: false,
    unpauseNotification: false,
    urgency: 'normal', // Has effect only on Linux
    // the following has effect only on Windows
    interactive: true,
    toastStyle: 1, // See plugins/notifications/utils for more info
    refreshOnPlayPause: false,
    trayControls: true,
    hideButtonText: false,
  } as NotificationsPluginConfig,
});

export default builder;

declare global {
  interface PluginBuilderList {
    [builder.id]: typeof builder;
  }
}
