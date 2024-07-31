/* eslint-disable prefer-const, @typescript-eslint/no-unused-vars */

import { createRenderer } from '@/utils';
import { SongInfo } from '@/providers/song-info';
import { YoutubePlayer } from '@/types/youtube-player';

import { makeLyricsRequest } from './lyrics';
import { selectors, tabStates } from './utils';
import { setConfig } from './renderer';
import { setCurrentTime } from './components/LyricsContainer';

import type { SyncedLyricsPluginConfig } from '../types';

export let _ytAPI: YoutubePlayer | null = null;

export const renderer = createRenderer({
  onConfigChange(newConfig) {
    setConfig(newConfig as SyncedLyricsPluginConfig);
  },

  observerCallback(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      const header = mutation.target as HTMLElement;

      switch (mutation.attributeName) {
        case 'disabled':
          header.removeAttribute('disabled');
          break;
        case 'aria-selected':
          tabStates[header.ariaSelected as 'true' | 'false']?.(
            _ytAPI?.getVideoData(),
          );
          break;
      }
    }
  },

  onPlayerApiReady(api) {
    _ytAPI = api;

    // @ts-expect-error type is 'unknown', so TS complains
    api.addEventListener('videodatachange', this.videoDataChange);

    // @ts-expect-error type is 'unknown', so TS complains
    this.videoDataChange();
  },

  hasAddedEvents: false,
  observer: null as MutationObserver | null,
  videoDataChange() {
    if (!this.hasAddedEvents) {
      const video = document.querySelector('video');

      // @ts-expect-error type is 'unknown', so TS complains
      video?.addEventListener('timeupdate', this.progressCallback);

      if (video) this.hasAddedEvents = true;
    }

    const header = document.querySelector<HTMLElement>(selectors.head);
    if (!header) return;

    this.observer ??= new MutationObserver(
      this.observerCallback as MutationCallback,
    );

    // Force the lyrics tab to be enabled at all times.
    this.observer.disconnect();
    this.observer.observe(header, { attributes: true });
    header.removeAttribute('disabled');
  },

  progressCallback(evt: Event) {
    switch (evt.type) {
      case 'timeupdate': {
        const video = evt.target as HTMLVideoElement;
        setCurrentTime(video.currentTime * 1000);
        break;
      }
    }
  },

  async start({ getConfig, ipc: { on } }) {
    setConfig((await getConfig()) as SyncedLyricsPluginConfig);

    on('ytmd:update-song-info', async (info: SongInfo) => {
      await makeLyricsRequest(info);
    });
  },
});
