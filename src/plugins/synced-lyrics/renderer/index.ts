/* eslint-disable prefer-const, @typescript-eslint/no-unused-vars */

import { createRenderer } from '@/utils';
import { SongInfo } from '@/providers/song-info';
import { YoutubePlayer } from '@/types/youtube-player';

import { makeLyricsRequest, initLyricsStyle } from './lyrics';
import { selectors, tabStates } from './utils';
import { setConfig } from './renderer';
import { setCurrentTime, setLineLyrics } from './components/LyricsContainer';

import type { SyncedLyricsPluginConfig } from '../types';

export let _ytAPI: YoutubePlayer | null = null;

export const renderer = createRenderer({
  onConfigChange(newConfig) {
    setConfig(newConfig as SyncedLyricsPluginConfig);
    initLyricsStyle();
  },

  observerCallback(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      const header = <HTMLElement>mutation.target;

      switch (mutation.attributeName) {
        case 'disabled':
          header.removeAttribute('disabled');
          break;
        case 'aria-selected':
          // @ts-expect-error I know what I am doing, fuck off TypeSript
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          tabStates[header.ariaSelected]?.(_ytAPI?.getVideoData());
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
  observer: <MutationObserver | null>null,
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
      <MutationCallback>this.observerCallback,
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
    initLyricsStyle();

    on('ytmd:update-song-info', async (info: SongInfo) => {
      await makeLyricsRequest(info);
    });
  },
});
