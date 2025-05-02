import { createRenderer } from '@/utils';
import { waitForElement } from '@/utils/wait-for-element';

import { selectors, tabStates } from './utils';
import { config, setConfig, setCurrentTime } from './renderer';

import { fetchLyrics } from '../providers';

import type { RendererContext } from '@/types/contexts';
import type { YoutubePlayer } from '@/types/youtube-player';
import type { SongInfo } from '@/providers/song-info';
import type { SyncedLyricsPluginConfig } from '../types';
import { createEffect } from 'solid-js';
import {
  lyricsOffset,
  setLyricsOffset,
} from './components/LyricsPickerAdvanced';

export let _ytAPI: YoutubePlayer | null = null;
export let netFetch: (
  url: string,
  init?: RequestInit,
) => Promise<[number, string, Record<string, string>]>;

export const renderer = createRenderer<
  {
    observerCallback: MutationCallback;
    observer?: MutationObserver;
    videoDataChange: () => Promise<void>;
    updateTimestampInterval?: NodeJS.Timeout | string | number;
  },
  SyncedLyricsPluginConfig
>({
  onConfigChange(newConfig) {
    setConfig(newConfig);
  },

  observerCallback(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      const header = mutation.target as HTMLElement;

      switch (mutation.attributeName) {
        case 'disabled':
          header.removeAttribute('disabled');
          break;
        case 'aria-selected':
          tabStates[header.ariaSelected ?? 'false']();
          break;
      }
    }
  },

  async onPlayerApiReady(api: YoutubePlayer) {
    _ytAPI = api;

    api.addEventListener('videodatachange', this.videoDataChange);

    await this.videoDataChange();
  },
  async videoDataChange() {
    if (!this.updateTimestampInterval) {
      this.updateTimestampInterval = setInterval(
        () => setCurrentTime((_ytAPI?.getCurrentTime() ?? 0) * 1000),
        100,
      );
    }

    // prettier-ignore
    this.observer ??= new MutationObserver(this.observerCallback);
    this.observer.disconnect();

    // Force the lyrics tab to be enabled at all times.
    const header = await waitForElement<HTMLElement>(selectors.head);
    {
      header.removeAttribute('disabled');
      tabStates[header.ariaSelected ?? 'false']();
    }

    this.observer.observe(header, { attributes: true });
    header.removeAttribute('disabled');
  },

  async start(ctx: RendererContext<SyncedLyricsPluginConfig>) {
    netFetch = ctx.ipc.invoke.bind(ctx.ipc, 'synced-lyrics:fetch');

    setConfig(await ctx.getConfig());

    let hasInit = false;
    createEffect(() => {
      const offset = lyricsOffset();
      if (offset !== 0) return;

      if (hasInit) return;
      hasInit = true;

      setLyricsOffset(config()?.lyricsOffset ?? 0);
    });

    createEffect(() => {
      if (!hasInit) return;
      const offset = lyricsOffset();
      ctx.setConfig({ lyricsOffset: offset });
    });

    ctx.ipc.on('ytmd:update-song-info', (info: SongInfo) => {
      fetchLyrics(info);
    });
  },
});
