import { Menu, nativeImage, screen, Tray } from 'electron';
import is from 'electron-is';

import defaultPlayIcon from '@assets/tray-icons/default/play.png?asset&asarUnpack';
import defaultPauseIcon from '@assets/tray-icons/default/pause.png?asset&asarUnpack';
import fluentPlayIcon from '@assets/tray-icons/fluent/play.png?asset&asarUnpack';
import fluentPauseIcon from '@assets/tray-icons/fluent/pause.png?asset&asarUnpack';
import materialPlayIcon from '@assets/tray-icons/material/play.png?asset&asarUnpack';
import materialPauseIcon from '@assets/tray-icons/material/pause.png?asset&asarUnpack';
import config from './config';
import { restart } from './providers/app-controls';
import registerCallback, {
  SongInfo,
  SongInfoEvent,
} from './providers/song-info';
import getSongControls from './providers/song-controls';
import { t } from '@/i18n';
import { TrayIconTheme } from '@/config/defaults';

import type { MenuTemplate } from './menu';

/**
 * This ensures that the tray instance is not garbage-collected.
 */
let tray: Electron.Tray | undefined;

export interface IconSet {
  play: Electron.NativeImage;
  pause: Electron.NativeImage;
}

type TrayEvent = (
  event: Electron.KeyboardEvent,
  bounds: Electron.Rectangle,
) => void;

const getIcons = (theme: TrayIconTheme) => {
  switch (theme) {
    case TrayIconTheme.Fluent:
      return {
        play: fluentPlayIcon,
        pause: fluentPauseIcon,
      };
    case TrayIconTheme.Material:
      return {
        play: materialPlayIcon,
        pause: materialPauseIcon,
      };
    case TrayIconTheme.Default:
    default:
      return {
        play: defaultPlayIcon,
        pause: defaultPauseIcon,
      };
  }
};

const getTrayIcon = (
  iconPath: string,
  pixelRatio: number,
): Electron.NativeImage =>
  nativeImage.createFromPath(iconPath).resize({
    width: 16 * pixelRatio,
    height: 16 * pixelRatio,
  });

export const createTrayIconSet = (
  theme: TrayIconTheme,
  pixelRatio: number,
): IconSet => {
  const { play: playIconPath, pause: pauseIconPath } = getIcons(theme);

  return {
    play: getTrayIcon(playIconPath, pixelRatio),
    pause: getTrayIcon(pauseIconPath, pixelRatio),
  };
};
const createTrayMenu = (
  playPause: () => void,
  next: () => void,
  previous: () => void,
  showWindow: () => void,
): MenuTemplate => [
  {
    label: t('main.tray.play-pause'),
    click: playPause,
  },
  {
    label: t('main.tray.next'),
    click: next,
  },
  {
    label: t('main.tray.previous'),
    click: previous,
  },
  {
    label: t('main.tray.show'),
    click: showWindow,
  },
  {
    type: 'separator',
  },
  {
    label: t('main.tray.restart'),
    click: restart,
  },
  {
    type: 'separator',
  },
  {
    label: t('main.tray.quit'),
    role: 'quit',
  },
];

const updateTrayTooltip = (
  trayInstance: Electron.Tray,
  songInfo: SongInfo,
  iconSet: IconSet,
): void => {
  trayInstance.setToolTip(
    t('main.tray.tooltip.with-song-info', {
      artist: songInfo.artist,
      title: songInfo.title,
    }),
  );
  trayInstance.setImage(songInfo.isPaused ? iconSet.play : iconSet.pause);
};

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

/**
 * This behavior is disabled on macOS as double-click events are ignored
 * via `setIgnoreDoubleClickEvents(true)` in `setMacSpecificTraySettings`.
 */
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
    tray?.destroy();
    tray = undefined;
    return;
  }

  const { playPause, next, previous } = getSongControls(win);
  const pixelRatio = getPixelRatio();
  const trayIconTheme =
    config.get('options.trayIconTheme') || TrayIconTheme.Default;
  const iconSet = createTrayIconSet(trayIconTheme, pixelRatio);

  tray?.destroy();
  tray = new Tray(iconSet.play);
  setMacSpecificTraySettings(tray);

  const showWindow = () => {
    win.show();
    app.dock?.show();
  };

  const trayMenu = createTrayMenu(playPause, next, previous, showWindow);

  tray.setContextMenu(Menu.buildFromTemplate(trayMenu));
  tray.setToolTip(t('main.tray.tooltip.default'));
  tray.on('click', () => handleTrayClick(app, win, playPause));

  registerCallback((songInfo, event) => {
    if (!tray || event === SongInfoEvent.TimeChanged) return;
    updateTrayTooltip(tray, songInfo, iconSet);
  });
};
