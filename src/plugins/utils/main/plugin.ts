import is from 'electron-is';

import { pluginBuilders } from 'virtual:PluginBuilders';

export const getAvailablePluginNames = () => {
  return Object.keys(pluginBuilders)
    .filter((id) => {
      if (is.windows() && id === 'touchbar') {
        return false;
      } else if (is.macOS() && id === 'taskbar-mediacontrol') {
        return false;
      } else if (is.linux() && (id === 'taskbar-mediacontrol' || id === 'touchbar')) {
        return false;
      }
      return true;
    });
};
