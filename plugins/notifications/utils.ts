import path from 'node:path';
import fs from 'node:fs';

import { app, NativeImage } from 'electron';

import config from './config';

import { cache } from '../../providers/decorators';
import { SongInfo } from '../../providers/song-info';

const icon = 'assets/youtube-music.png';
const userData = app.getPath('userData');
const temporaryIcon = path.join(userData, 'tempIcon.png');
const temporaryBanner = path.join(userData, 'tempBanner.png');


export const ToastStyles = {
  logo: 1,
  banner_centered_top: 2,
  hero: 3,
  banner_top_custom: 4,
  banner_centered_bottom: 5,
  banner_bottom: 6,
  legacy: 7,
};

export const icons = {
  play: '\u{1405}', // ᐅ
  pause: '\u{2016}', // ‖
  next: '\u{1433}', // ᐳ
  previous: '\u{1438}', // ᐸ
};

export const urgencyLevels = [
  { name: 'Low', value: 'low' },
  { name: 'Normal', value: 'normal' },
  { name: 'High', value: 'critical' },
];

const nativeImageToLogo = cache((nativeImage: NativeImage) => {
  const temporaryImage = nativeImage.resize({ height: 256 });
  const margin = Math.max(temporaryImage.getSize().width - 256, 0);

  return temporaryImage.crop({
    x: Math.round(margin / 2),
    y: 0,
    width: 256,
    height: 256,
  });
});

export const notificationImage = (songInfo: SongInfo) => {
  if (!songInfo.image) {
    return icon;
  }

  if (!config.get('interactive')) {
    return nativeImageToLogo(songInfo.image);
  }

  switch (config.get('toastStyle')) {
    case ToastStyles.logo:
    case ToastStyles.legacy: {
      return saveImage(nativeImageToLogo(songInfo.image), temporaryIcon);
    }

    default: {
      return saveImage(songInfo.image, temporaryBanner);
    }
  }
};

export const saveImage = cache((img: NativeImage, savePath: string) => {
  try {
    fs.writeFileSync(savePath, img.toPNG());
  } catch (error: unknown) {
    console.log(`Error writing song icon to disk:\n${String(error)}`);
    return icon;
  }

  return savePath;
});

export const saveTempIcon = () => {
  for (const kind of Object.keys(icons)) {
    const destinationPath = path.join(userData, 'icons', `${kind}.png`);
    if (fs.existsSync(destinationPath)) {
      continue;
    }

    const iconPath = path.resolve(__dirname, 'assets', 'media-icons-black', `${kind}.png`);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFile(iconPath, destinationPath, () => {
    });
  }
};

export const snakeToCamel = (string_: string) => string_.replaceAll(/([-_][a-z]|^[a-z])/g, (group) =>
  group.toUpperCase()
    .replace('-', ' ')
    .replace('_', ' '),
);

export const secondsToMinutes = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = seconds % 60;
  return `${minutes}:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;
};
