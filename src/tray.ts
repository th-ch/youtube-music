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

import type {
  App,
  BrowserWindow,
  NativeImage,
  KeyboardEvent,
  Rectangle,
} from 'electron';

import type { MenuTemplate } from './menu';

/**
 * This ensures that the tray instance is not garbage-collected.
 */
let tray: Tray | undefined;
const ICON_SIZE = 16;

interface AppContext {
  app: App;
  win: BrowserWindow;
}

interface IconSet {
  play: NativeImage;
  pause: NativeImage;
}

interface SongControls {
  playPause: () => void;
  next: () => void;
  previous: () => void;
}

type TrayEvent = (event: KeyboardEvent, bounds: Rectangle) => void;

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

const createTrayIcon = (iconPath: string, pixelRatio: number): NativeImage => {
  const iconDimensions = {
    width: ICON_SIZE * pixelRatio,
    height: ICON_SIZE * pixelRatio,
  };

  return nativeImage.createFromPath(iconPath).resize(iconDimensions);
};

export const createTrayIconSet = (
  theme: TrayIconTheme,
  pixelRatio: number,
): IconSet => {
  const { play: playIconPath, pause: pauseIconPath } = getIcons(theme);

  return {
    play: createTrayIcon(playIconPath, pixelRatio),
    pause: createTrayIcon(pauseIconPath, pixelRatio),
  };
};

const createTrayMenu = (
  songControls: SongControls,
  showWindow: () => AppContext,
): MenuTemplate => [
  {
    label: t('main.tray.play-pause'),
    click: songControls.playPause,
  },
  {
    label: t('main.tray.next'),
    click: songControls.next,
  },
  {
    label: t('main.tray.previous'),
    click: songControls.previous,
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
  tray: Tray,
  songInfo: SongInfo,
  iconSet: IconSet,
): void => {
  const { title, artist } = songInfo;

  tray.setToolTip(t('main.tray.tooltip.with-song-info', { title, artist }));
  tray.setImage(songInfo.isPaused ? iconSet.play : iconSet.pause);
};

const handleTrayClick = (
  context: AppContext,
  togglePlayPause: () => void,
): void =>
  config.get('options.trayClickPlayPause')
    ? togglePlayPause()
    : toggleWindowVisibility(context);

const toggleWindowVisibility = (appContext: AppContext): void => {
  const { win, app } = appContext;
  const isMac = is.macOS();
  const isVisible = win.isVisible();

  if (isVisible) {
    win.hide();
    if (isMac) {
      app.dock?.hide();
    }
  } else {
    win.show();
    if (isMac) {
      app.dock?.show();
    }
  }
};

const configureMacTraySettings = (tray: Tray): void => {
  tray.setIgnoreDoubleClickEvents(true);
};

const getPixelRatio = (): number => {
  const isWindows = is.windows();
  const defaultScaleFactor = 1;
  const scaleFactor = screen.getPrimaryDisplay().scaleFactor;

  return isWindows ? scaleFactor || defaultScaleFactor : defaultScaleFactor;
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
export const setTrayOnDoubleClick = (listener: TrayEvent): void => {
  if (!tray) return;

  tray.removeAllListeners('double-click');
  tray.on('double-click', listener);
};

export const setUpTray = (appContext: AppContext): void => {
  const isTrayEnabled = config.get('options.tray');
  if (!isTrayEnabled) {
    destroyTray();
    return;
  }

  const trayIcons = createTrayIcons();
  initializeTray(trayIcons.play);
  configureMacTraySettings(tray!);

  const trayMenu = createAppTrayMenu(appContext);
  configureTrayMenu(trayMenu);

  configureTrayClickHandlers(appContext);
  registerSongInfoCallback(trayIcons);
};

const createTrayIcons = (): IconSet => {
  const theme = getTrayTheme();
  const pixelRatio = getPixelRatio();

  return createTrayIconSet(theme, pixelRatio);
};

const createAppTrayMenu = (appContext: AppContext): MenuTemplate => {
  const songControls = getSongControls(appContext.win);
  const showWindow = (): AppContext => appContext;

  return createTrayMenu(songControls, showWindow);
};

const destroyTray = (): void => {
  tray?.destroy();
  tray = undefined;
};

const getTrayTheme = (): TrayIconTheme => {
  return config.get('options.trayIconTheme') || TrayIconTheme.Default;
};

const initializeTray = (icon: NativeImage): void => {
  destroyTray();
  tray = new Tray(icon);
};

const configureTrayMenu = (menuTemplate: MenuTemplate): void => {
  tray?.setContextMenu(Menu.buildFromTemplate(menuTemplate));
  tray?.setToolTip(t('main.tray.tooltip.default'));
};

const configureTrayClickHandlers = (context: AppContext): void => {
  const songControls = getSongControls(context.win).playPause;
  tray?.on('click', () => handleTrayClick(context, songControls));
};

const registerSongInfoCallback = (iconSet: IconSet): void => {
  registerCallback((songInfo, event) => {
    if (!tray || event === SongInfoEvent.TimeChanged) return;
    updateTrayTooltip(tray, songInfo, iconSet);
  });
};
