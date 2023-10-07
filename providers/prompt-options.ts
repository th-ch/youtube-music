import path from 'node:path';

import { getAssetsDirectoryLocation } from '../plugins/utils';

const iconPath = path.join(getAssetsDirectoryLocation(), 'youtube-music-tray.png');

const promptOptions = {
  customStylesheet: 'dark',
  icon: iconPath,
};

export default () => promptOptions;
