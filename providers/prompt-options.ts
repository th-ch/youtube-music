import path from 'node:path';

const iconPath = path.join(__dirname, '..', 'assets', 'youtube-music-tray.png');

const promptOptions = {
  customStylesheet: 'dark',
  icon: iconPath,
};

export default () => promptOptions;
