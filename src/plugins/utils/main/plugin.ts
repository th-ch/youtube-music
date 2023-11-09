import is from 'electron-is';

import defaultConfig from '../../../config/defaults';

export const getAvailablePluginNames = () => {
  return Object.keys(defaultConfig.plugins).filter((name) => {
    if (is.windows() && name === 'touchbar') {
      return false;
    } else if (is.macOS() && name === 'taskbar-mediacontrol') {
      return false;
    } else if (is.linux() && (name === 'taskbar-mediacontrol' || name === 'touchbar')) {
      return false;
    }
    return true;
  });
};
