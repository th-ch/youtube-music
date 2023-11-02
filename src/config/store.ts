import Store from 'electron-store';
import Conf from 'conf';
import is from 'electron-is';

import defaults from './defaults';

import { DefaultPresetList, type Preset } from '../plugins/downloader/types';

const getDefaults = () => {
  if (is.windows()) {
    defaults.plugins['in-app-menu'].enabled = true;
  }
  return defaults;
};

const setDefaultPluginOptions = (store: Conf<Record<string, unknown>>, plugin: keyof typeof defaults.plugins) => {
  if (!store.get(`plugins.${plugin}`)) {
    store.set(`plugins.${plugin}`, defaults.plugins[plugin]);
  }
};

const migrations = {
  '>=2.1.3'(store: Conf<Record<string, unknown>>) {
    const listenAlong = store.get('plugins.discord.listenAlong');
    if (listenAlong !== undefined) {
      store.set('plugins.discord.playOnYouTubeMusic', listenAlong);
      store.delete('plugins.discord.listenAlong');
    }
  },
  '>=2.1.0'(store: Conf<Record<string, unknown>>) {
    const originalPreset = store.get('plugins.downloader.preset') as string | undefined;
    if (originalPreset) {
      if (originalPreset !== 'opus') {
        store.set('plugins.downloader.selectedPreset', 'Custom');
        store.set('plugins.downloader.customPresetSetting', {
          extension: 'mp3',
          ffmpegArgs: store.get('plugins.downloader.ffmpegArgs') as string[] ?? DefaultPresetList['mp3 (256kbps)'].ffmpegArgs,
        } satisfies Preset);
      } else {
        store.set('plugins.downloader.selectedPreset', 'Source');
        store.set('plugins.downloader.customPresetSetting', {
          extension: null,
          ffmpegArgs: store.get('plugins.downloader.ffmpegArgs') as string[] ?? [],
        } satisfies Preset);
      }
      store.delete('plugins.downloader.preset');
      store.delete('plugins.downloader.ffmpegArgs');
    }
  },
  '>=1.20.0'(store: Conf<Record<string, unknown>>) {
    setDefaultPluginOptions(store, 'visualizer');

    if (store.get('plugins.notifications.toastStyle') === undefined) {
      const pluginOptions = store.get('plugins.notifications') || {};
      store.set('plugins.notifications', {
        ...defaults.plugins.notifications,
        ...pluginOptions,
      });
    }

    if (store.get('options.ForceShowLikeButtons')) {
      store.delete('options.ForceShowLikeButtons');
      store.set('options.likeButtons', 'force');
    }
  },
  '>=1.17.0'(store: Conf<Record<string, unknown>>) {
    setDefaultPluginOptions(store, 'picture-in-picture');

    if (store.get('plugins.video-toggle.mode') === undefined) {
      store.set('plugins.video-toggle.mode', 'custom');
    }
  },
  '>=1.14.0'(store: Conf<Record<string, unknown>>) {
    if (
      typeof store.get('plugins.precise-volume.globalShortcuts') !== 'object'
    ) {
      store.set('plugins.precise-volume.globalShortcuts', {});
    }

    if (store.get('plugins.hide-video-player.enabled')) {
      store.delete('plugins.hide-video-player');
      store.set('plugins.video-toggle.enabled', true);
    }
  },
  '>=1.13.0'(store: Conf<Record<string, unknown>>) {
    if (store.get('plugins.discord.listenAlong') === undefined) {
      store.set('plugins.discord.listenAlong', true);
    }
  },
  '>=1.12.0'(store: Conf<Record<string, unknown>>) {
    const options = store.get('plugins.shortcuts') as Record<string, {
      action: string;
      shortcut: unknown;
    }[] | Record<string, unknown>>;
    let updated = false;
    for (const optionType of ['global', 'local']) {
      if (Array.isArray(options[optionType])) {
        const optionsArray = options[optionType] as {
          action: string;
          shortcut: unknown;
        }[];
        const updatedOptions: Record<string, unknown> = {};
        for (const optionObject of optionsArray) {
          if (optionObject.action && optionObject.shortcut) {
            updatedOptions[optionObject.action] = optionObject.shortcut;
          }
        }

        options[optionType] = updatedOptions;
        updated = true;
      }
    }

    if (updated) {
      store.set('plugins.shortcuts', options);
    }
  },
  '>=1.11.0'(store: Conf<Record<string, unknown>>) {
    if (store.get('options.resumeOnStart') === undefined) {
      store.set('options.resumeOnStart', true);
    }
  },
  '>=1.7.0'(store: Conf<Record<string, unknown>>) {
    const enabledPlugins = store.get('plugins') as string[];
    if (!Array.isArray(enabledPlugins)) {
      console.warn('Plugins are not in array format, cannot migrate');
      return;
    }

    // Include custom options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plugins: Record<string, any> = {
      adblocker: {
        enabled: true,
        cache: true,
        additionalBlockLists: [],
      },
      downloader: {
        enabled: false,
        ffmpegArgs: [], // E.g. ["-b:a", "192k"] for an audio bitrate of 192kb/s
        downloadFolder: undefined, // Custom download folder (absolute path)
      },
    };

    for (const enabledPlugin of enabledPlugins) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      plugins[enabledPlugin] = {
        ...plugins[enabledPlugin],
        enabled: true,
      };
    }

    store.set('plugins', plugins);
  },
};

export default new Store({
  defaults: getDefaults(),
  clearInvalidConfig: false,
  migrations,
});
