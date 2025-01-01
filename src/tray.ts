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
const ICON_SIZE = 16;

interface AppContext {
  app: Electron.App;
  win: Electron.BrowserWindow;
}

interface IconSet {
  play: Electron.NativeImage;
  pause: Electron.NativeImage;
}

interface SongControls {
  playPause: () => void;
  next: () => void;
  previous: () => void;
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
    width: ICON_SIZE * pixelRatio,
    height: ICON_SIZE * pixelRatio,
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
  tray: Electron.Tray,
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

const toggleWindowVisibility = (appContext: AppContext): void =>
  appContext.win.isVisible()
    ? hideWindowAndDock(appContext)
    : showWindowAndDock(appContext);

const hideWindowAndDock = ({ win, app }: AppContext): void => {
  win.hide();
  app.dock?.hide();
};

const showWindowAndDock = ({ win, app }: AppContext): void => {
  win.show();
  app.dock?.show();
};

const configureMacTraySettings = (tray: Electron.Tray): void => {
  tray.setIgnoreDoubleClickEvents(true);
};

const getPixelRatio = (): number => {
  const defaultScaleFactor = 1;
  const scaleFactor = screen.getPrimaryDisplay().scaleFactor;

  return is.windows() ? scaleFactor || defaultScaleFactor : defaultScaleFactor;
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

export const setUpTray = ({ win, app }: AppContext): void => {
  if (!config.get('options.tray')) {
    destroyTray();
    return;
  }

  const pixelRatio = getPixelRatio();
  const theme = getTrayTheme();
  const iconSet = createTrayIconSet(theme, pixelRatio);

  initializeTray(iconSet.play);
  configureMacTraySettings(tray!);

  const songControls = getSongControls(win);
  const showWindow = () => ({ app, win });
  const trayMenu = createTrayMenu(songControls, showWindow);
  configureTrayMenu(trayMenu);
  configureTrayClickHandlers({ app, win });

  registerSongInfoCallback(iconSet);
};

const destroyTray = (): void => {
  tray?.destroy();
  tray = undefined;
};

const getTrayTheme = (): TrayIconTheme => {
  return config.get('options.trayIconTheme') || TrayIconTheme.Default;
};

const initializeTray = (icon: Electron.NativeImage): void => {
  destroyTray(); // Ensure old tray is removed
  tray = new Tray(icon);
};

const configureTrayMenu = (menuTemplate: MenuTemplate): void => {
  tray?.setContextMenu(Menu.buildFromTemplate(menuTemplate));
  tray?.setToolTip(t('main.tray.tooltip.default'));
};

const configureTrayClickHandlers = (context: AppContext): void => {
  tray!.on('click', () =>
    handleTrayClick(context, getSongControls(context.win).playPause),
  );
};

const registerSongInfoCallback = (iconSet: IconSet): void => {
  registerCallback((songInfo, event) => {
    if (!tray || event === SongInfoEvent.TimeChanged) return;
    updateTrayTooltip(tray, songInfo, iconSet);
  });
};
