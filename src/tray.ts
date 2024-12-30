import { Menu, nativeImage, screen, Tray } from 'electron';
import is from 'electron-is';

import playTrayIconAsset from '@assets/tray-icons/play.png?asset&asarUnpack';
import pauseTrayIconAsset from '@assets/tray-icons/pause.png?asset&asarUnpack';

import config from './config';

import { restart } from './providers/app-controls';
import registerCallback, { SongInfoEvent } from './providers/song-info';
import getSongControls from './providers/song-controls';

import { t } from '@/i18n';

import type { MenuTemplate } from './menu';

let tray: Electron.Tray | undefined;

type TrayEvent = (
  event: Electron.KeyboardEvent,
  bounds: Electron.Rectangle,
) => void;

interface AppWindowControls {
  playPause: () => void;
  next: () => void;
  previous: () => void;
}

const getTrayIcon = (
  iconPath: string,
  pixelRatio: number,
): Electron.NativeImage =>
  nativeImage.createFromPath(iconPath).resize({
    width: 16 * pixelRatio,
    height: 16 * pixelRatio,
  });

const handleTrayClick = (
  app: Electron.App,
  win: Electron.BrowserWindow,
  playPause: () => void,
): void => {
  if (config.get('options.trayClickPlayPause')) {
    playPause();
  } else if (win.isVisible()) {
    win.hide();
    app.dock?.hide();
  } else {
    win.show();
    app.dock?.show();
  }
};

const setMacSpecificTraySettings = (trayInstance: Electron.Tray): void => {
  trayInstance.setIgnoreDoubleClickEvents(true);
};

const getPixelRatio = (): number => {
  return is.windows() ? screen.getPrimaryDisplay().scaleFactor || 1 : 1;
};

export const setTrayOnClick = (fn: TrayEvent): void => {
  if (!tray) return;
  tray.removeAllListeners('click');
  tray.on('click', fn);
};

export const setTrayOnDoubleClick = (fn: TrayEvent): void => {
  if (!tray) return;
  tray.removeAllListeners('double-click');
  tray.on('double-click', fn);
};

export const setUpTray = (
  app: Electron.App,
  win: Electron.BrowserWindow,
): void => {
  if (!config.get('options.tray')) {
    tray = undefined;
    return;
  }

  const { playPause, next, previous }: AppWindowControls = getSongControls(win);
  const pixelRatio = getPixelRatio();
  const playTrayIcon = getTrayIcon(playTrayIconAsset, pixelRatio);
  const pauseTrayIcon = getTrayIcon(pauseTrayIconAsset, pixelRatio);

  tray = new Tray(playTrayIcon);
  setMacSpecificTraySettings(tray);

  tray.setToolTip(t('main.tray.tooltip.default'));
  tray.on('click', () => handleTrayClick(app, win, playPause));

  const showWindow = (): void => {
    win.show();
    app.dock?.show();
  };

  const trayMenuTemplate: MenuTemplate = [
    { label: t('main.tray.play-pause'), click: playPause },
    { label: t('main.tray.next'), click: next },
    { label: t('main.tray.previous'), click: previous },
    { label: t('main.tray.show'), click: showWindow },
    { type: 'separator' },
    { label: t('main.tray.restart'), click: restart },
    { type: 'separator' },
    { label: t('main.tray.quit'), role: 'quit' },
  ];

  tray.setContextMenu(Menu.buildFromTemplate(trayMenuTemplate));

  registerCallback((songInfo, event) => {
    if (event === SongInfoEvent.TimeChanged || !tray) return;

    if (typeof songInfo.isPaused === 'undefined') {
      tray.setImage(playTrayIcon);
      return;
    }

    tray.setToolTip(
      t('main.tray.tooltip.with-song-info', {
        artist: songInfo.artist,
        title: songInfo.title,
      }),
    );
    tray.setImage(songInfo.isPaused ? playTrayIcon : pauseTrayIcon);
  });
};
