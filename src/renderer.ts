
// eslint-disable-next-line import/order
import { rendererPlugins } from 'virtual:RendererPlugins';

import { PluginBaseConfig, RendererPluginContext, RendererPluginFactory } from './plugins/utils/builder';

import { startingPages } from './providers/extracted-data';
import { setupSongControls } from './providers/song-controls-front';
import setupSongInfo from './providers/song-info-front';

const enabledPluginNameAndOptions = window.mainConfig.plugins.getEnabled();

let api: Element | null = null;

function listenForApiLoad() {
  api = document.querySelector('#movie_player');
  if (api) {
    onApiLoaded();
    return;
  }

  const observer = new MutationObserver(() => {
    api = document.querySelector('#movie_player');
    if (api) {
      observer.disconnect();
      onApiLoaded();
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

interface YouTubeMusicAppElement extends HTMLElement {
  navigate_(page: string): void;
}

function onApiLoaded() {
  const video = document.querySelector('video')!;
  const audioContext = new AudioContext();
  const audioSource = audioContext.createMediaElementSource(video);
  audioSource.connect(audioContext.destination);

  video.addEventListener(
    'loadstart',
    () => {
      // Emit "audioCanPlay" for each video
      video.addEventListener(
        'canplaythrough',
        () => {
          document.dispatchEvent(
            new CustomEvent('audioCanPlay', {
              detail: {
                audioContext,
                audioSource,
              },
            }),
          );
        },
        { once: true },
      );
    },
    { passive: true },
  );!

  document.dispatchEvent(new CustomEvent('apiLoaded', { detail: api }));
  window.ipcRenderer.send('apiLoaded');

  // Navigate to "Starting page"
  const startingPage: string = window.mainConfig.get('options.startingPage');
  if (startingPage && startingPages[startingPage]) {
    document.querySelector<YouTubeMusicAppElement>('ytmusic-app')?.navigate_(startingPages[startingPage]);
  }

  // Remove upgrade button
  if (window.mainConfig.get('options.removeUpgradeButton')) {
    const styles = document.createElement('style');
    styles.innerHTML = `ytmusic-guide-section-renderer #items ytmusic-guide-entry-renderer:last-child {
      display: none;
    }`;
    document.head.appendChild(styles);
  }

  // Hide / Force show like buttons
  const likeButtonsOptions: string = window.mainConfig.get('options.likeButtons');
  if (likeButtonsOptions) {
    const likeButtons: HTMLElement | null = document.querySelector('ytmusic-like-button-renderer');
    if (likeButtons) {
      likeButtons.style.display
        = {
        hide: 'none',
        force: 'inherit',
      }[likeButtonsOptions] || '';
    }
  }
}

const createContext = <
  Key extends keyof PluginBuilderList,
  Config extends PluginBaseConfig = PluginBuilderList[Key]['config'],
>(name: Key): RendererPluginContext<Config> => ({
  getConfig: async () => {
    const result = await window.ipcRenderer.invoke('get-config', name) as Config;

    return result;
  },
  setConfig: async (newConfig) => {
    await window.ipcRenderer.invoke('set-config', name, newConfig);
  },

  invoke: async <Return>(event: string, ...args: unknown[]): Promise<Return> => {
    return await window.ipcRenderer.invoke(event, ...args) as Return;
  },
  on: (event: string, listener) => {
    window.ipcRenderer.on(event, async (_, ...args) => listener(...args as never));
  },
});

(async () => {
  // enabledPluginNameAndOptions.forEach(async ([pluginName, options]) => {
  //   if (pluginName === 'ambient-mode') {
  //     const builder = rendererPlugins[pluginName];

  //     try {
  //       const context = createContext(pluginName);
  //       const plugin = await builder?.(context);
  //       console.log(plugin);
  //       plugin.onLoad?.();
  //     } catch (error) {
  //       console.error(`Error in plugin "${pluginName}"`);
  //       console.trace(error);
  //     }
  //   }

  //   if (Object.hasOwn(rendererPlugins, pluginName)) {
  //     const handler = rendererPlugins[pluginName];
  //     try {
  //       await handler?.(options as never);
  //     } catch (error) {
  //       console.error(`Error in plugin "${pluginName}"`);
  //       console.trace(error);
  //     }
  //   }
  // });

  const rendererPluginResult = await Promise.allSettled(
    enabledPluginNameAndOptions.map(async ([id]) => {
      // HACK: eslint has a bug detects the type of rendererPlugins as "any"
      const builder = (rendererPlugins as Record<string, RendererPluginFactory<PluginBaseConfig>>)[id];

      const context = createContext(id as keyof PluginBuilderList);
      return [id, await builder(context)] as const;
    }),
  );

  const rendererPluginList = rendererPluginResult
    .map((it) => it.status === 'fulfilled' ? it.value : null)
    .filter(Boolean);

  rendererPluginResult.forEach((it, index) => {
    if (it.status === 'rejected') {
      const id = enabledPluginNameAndOptions[index][0];
      console.error('[YTMusic]', `Cannot load plugin "${id}"`);
      console.trace(it.reason);
    }
  });

  rendererPluginList.forEach(([id, plugin]) => {
    try {
      plugin.onLoad?.();
      console.log('[YTMusic]', `"${id}" plugin is loaded`);
    } catch (error) {
      console.error('[YTMusic]', `Cannot load plugin "${id}"`);
      console.trace(error);
    }
  });

  window.ipcRenderer.on('config-changed', (_event, id: string, newConfig: PluginBaseConfig) => {
    const plugin = rendererPluginList.find(([pluginId]) => pluginId === id);

    if (plugin) {
      plugin[1].onConfigChange?.(newConfig);
    }
  });

  // Inject song-info provider
  setupSongInfo();

  // Inject song-controls
  setupSongControls();

  // Wait for complete load of YouTube api
  listenForApiLoad();

  // Blocks the "Are You Still There?" popup by setting the last active time to Date.now every 15min
  setInterval(() => window._lact = Date.now(), 900_000);

  // Setup back to front logger
  if (window.electronIs.dev()) {
    window.ipcRenderer.on('log', (_event, log: string) => {
      console.log(JSON.parse(log));
    });
  }
})();
