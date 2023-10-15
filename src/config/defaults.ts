import { blockers } from '../plugins/adblocker/blocker-types';

import { DefaultPresetList } from '../plugins/downloader/types';

export interface WindowSizeConfig {
  width: number;
  height: number;
}

export interface DefaultConfig {
  'window-size': {
    width: number;
    height: number;
  }
  'window-maximized': boolean;
  'window-position': {
    x: number;
    y: number;
  }
  url: string;
  options: {
    tray: boolean;
    appVisible: boolean;
    autoUpdates: boolean;
    alwaysOnTop: boolean;
    hideMenu: boolean;
    hideMenuWarned: boolean;
    startAtLogin: boolean;
    disableHardwareAcceleration: boolean;
    removeUpgradeButton: boolean;
    restartOnConfigChanges: boolean;
    trayClickPlayPause: boolean;
    autoResetAppCache: boolean;
    resumeOnStart: boolean;
    likeButtons: string;
    proxy: string;
    startingPage: string;
    overrideUserAgent: boolean;
    themes: string[];
  }
}

const defaultConfig = {
  'window-size': {
    width: 1100,
    height: 550,
  },
  'window-maximized': false,
  'window-position': {
    x: -1,
    y: -1,
  },
  'url': 'https://music.youtube.com',
  'options': {
    tray: false,
    appVisible: true,
    autoUpdates: true,
    alwaysOnTop: false,
    hideMenu: false,
    hideMenuWarned: false,
    startAtLogin: false,
    disableHardwareAcceleration: false,
    removeUpgradeButton: false,
    restartOnConfigChanges: false,
    trayClickPlayPause: false,
    autoResetAppCache: false,
    resumeOnStart: true,
    likeButtons: '',
    proxy: '',
    startingPage: '',
    overrideUserAgent: false,
    themes: [] as string[],
  },
  /** please order alphabetically */
  'plugins': {
    'adblocker': {
      enabled: true,
      cache: true,
      blocker: blockers.WithBlocklists as string,
      additionalBlockLists: [], // Additional list of filters, e.g "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt"
      disableDefaultLists: false,
    },
    'album-color-theme': {},
    'ambient-mode': {},
    'audio-compressor': {},
    'blur-nav-bar': {},
    'bypass-age-restrictions': {},
    'captions-selector': {
      enabled: false,
      disableCaptions: false,
      autoload: false,
      lastCaptionsCode: '',
    },
    'compact-sidebar': {},
    'crossfade': {
      enabled: false,
      fadeInDuration: 1500, // Ms
      fadeOutDuration: 5000, // Ms
      secondsBeforeEnd: 10, // S
      fadeScaling: 'linear', // 'linear', 'logarithmic' or a positive number in dB
    },
    'disable-autoplay': {
      applyOnce: false,
    },
    'discord': {
      enabled: false,
      autoReconnect: true, // If enabled, will try to reconnect to discord every 5 seconds after disconnecting or failing to connect
      activityTimoutEnabled: true, // If enabled, the discord rich presence gets cleared when music paused after the time specified below
      activityTimoutTime: 10 * 60 * 1000, // 10 minutes
      listenAlong: true, // Add a "listen along" button to rich presence
      hideGitHubButton: false, // Disable the "View App On GitHub" button
      hideDurationLeft: false, // Hides the start and end time of the song to rich presence
    },
    'downloader': {
      enabled: false,
      downloadFolder: undefined as string | undefined, // Custom download folder (absolute path)
      selectedPreset: 'mp3 (256kbps)', // Selected preset
      customPresetSetting: DefaultPresetList['mp3 (256kbps)'], // Presets
      skipExisting: false,
      playlistMaxItems: undefined as number | undefined,
    },
    'exponential-volume': {},
    'in-app-menu': {
      /**
       * true in Windows, false in Linux and macOS (see youtube-music/config/store.ts)
       */
      enabled: false,
    },
    'last-fm': {
      enabled: false,
      token: undefined as string | undefined, // Token used for authentication
      session_key: undefined as string | undefined, // Session key used for scrobbling
      api_root: 'http://ws.audioscrobbler.com/2.0/',
      api_key: '04d76faaac8726e60988e14c105d421a', // Api key registered by @semvis123
      secret: 'a5d2a36fdf64819290f6982481eaffa2',
    },
    'lumiastream': {},
    'lyrics-genius': {
      romanizedLyrics: false,
    },
    'navigation': {
      enabled: true,
    },
    'no-google-login': {},
    'notifications': {
      enabled: false,
      unpauseNotification: false,
      urgency: 'normal', // Has effect only on Linux
      // the following has effect only on Windows
      interactive: true,
      toastStyle: 1, // See plugins/notifications/utils for more info
      refreshOnPlayPause: false,
      trayControls: true,
      hideButtonText: false,
    },
    'picture-in-picture': {
      'enabled': false,
      'alwaysOnTop': true,
      'savePosition': true,
      'saveSize': false,
      'hotkey': 'P',
      'pip-position': [10, 10],
      'pip-size': [450, 275],
      'isInPiP': false,
      'useNativePiP': false,
    },
    'playback-speed': {},
    'precise-volume': {
      enabled: false,
      steps: 1, // Percentage of volume to change
      arrowsShortcut: true, // Enable ArrowUp + ArrowDown local shortcuts
      globalShortcuts: {
        volumeUp: '',
        volumeDown: '',
      },
      savedVolume: undefined as number | undefined, // Plugin save volume between session here
    },
    'quality-changer': {},
    'shortcuts': {
      enabled: false,
      overrideMediaKeys: false,
      global: {
        previous: '',
        playPause: '',
        next: '',
      } as Record<string, string>,
      local: {
        previous: '',
        playPause: '',
        next: '',
      } as Record<string, string>,
    },
    'skip-silences': {
      onlySkipBeginning: false,
    },
    'sponsorblock': {
      enabled: false,
      apiURL: 'https://sponsor.ajay.app',
      categories: [
        'sponsor',
        'intro',
        'outro',
        'interaction',
        'selfpromo',
        'music_offtopic',
      ],
    },
    'taskbar-mediacontrol': {},
    'touchbar': {},
    'tuna-obs': {},
    'video-toggle': {
      enabled: false,
      hideVideo: false,
      mode: 'custom',
      forceHide: false,
      align: '',
    },
    'visualizer': {
      enabled: false,
      type: 'butterchurn',
      // Config per visualizer
      butterchurn: {
        preset: 'martin [shadow harlequins shape code] - fata morgana',
        renderingFrequencyInMs: 500,
        blendTimeInSeconds: 2.7,
      },
      vudio: {
        effect: 'lighting',
        accuracy: 128,
        lighting: {
          maxHeight: 160,
          maxSize: 12,
          lineWidth: 1,
          color: '#49f3f7',
          shadowBlur: 2,
          shadowColor: 'rgba(244,244,244,.5)',
          fadeSide: true,
          prettify: false,
          horizontalAlign: 'center',
          verticalAlign: 'middle',
          dottify: true,
        },
      },
      wave: {
        animations: [
          {
            type: 'Cubes',
            config: {
              bottom: true,
              count: 30,
              cubeHeight: 5,
              fillColor: { gradient: ['#FAD961', '#F76B1C'] },
              lineColor: 'rgba(0,0,0,0)',
              radius: 20,
            },
          },
          {
            type: 'Cubes',
            config: {
              top: true,
              count: 12,
              cubeHeight: 5,
              fillColor: { gradient: ['#FAD961', '#F76B1C'] },
              lineColor: 'rgba(0,0,0,0)',
              radius: 10,
            },
          },
          {
            type: 'Circles',
            config: {
              lineColor: {
                gradient: ['#FAD961', '#FAD961', '#F76B1C'],
                rotate: 90,
              },
              lineWidth: 4,
              diameter: 20,
              count: 10,
              frequencyBand: 'base',
            },
          },
        ],
      },
    },
  },
};

export default defaultConfig;
