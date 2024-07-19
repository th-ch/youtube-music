import { createRenderer } from '@/utils';
import { SongInfo } from '@/providers/song-info';
import { YoutubePlayer } from '@/types/youtube-player';

import {
  makeLyricsRequest,
  initLyricsStyle,
  setLyrics,
  createProgressEvents,
  interval,
  resetAllVariables,
} from './lyrics';

import type { LineLyrics, SyncedLyricsPluginConfig } from '../types';

export const secToMilisec = (t: number) => Math.round(Number(t) * 1e3);
export let syncedLyricList: Array<LineLyrics> = [];
export let hadSecondAttempt: boolean = false;
export let config: SyncedLyricsPluginConfig | null = null;
export let lyrics: Array<LineLyrics> | null;
export let songWithLyrics: boolean = true;

let unregister: CallableFunction | null = null;
let timeout: NodeJS.Timeout | null = null;

export const selectors = {
  head: '#tabsContent > .tab-header:nth-of-type(2)',
};

const newSongReset = () => {
  timeout && clearTimeout(timeout);
  interval && clearInterval(interval);

  syncedLyricList = [];
  hadSecondAttempt = false;
  lyrics = null;
  songWithLyrics = true;

  resetAllVariables();
};

export const renderer = createRenderer({
  api: <YoutubePlayer | null>null,

  onConfigChange(newConfig: SyncedLyricsPluginConfig) {
    config = newConfig;
  },

  observer: <MutationObserver | null>null,
  observerCallback(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      const header = <HTMLElement>mutation.target;

      switch (mutation.attributeName) {
        case 'disabled':
          header.removeAttribute('disabled');
          break;
      }
    }
  },

  onPlayerApiReady(api) {
    this.api = api;

    // @ts-expect-error type is 'unknown', so TS complains
    api.addEventListener('videodatachange', this.videoDataChange);

    // @ts-expect-error type is 'unknown', so TS complains
    this.videoDataChange();
  },

  // prettier-ignore
  videoDataChange() {
    const header = document.querySelector<HTMLElement>(selectors.head);
    if (!header) return;

    this.observer ??= new MutationObserver(<MutationCallback>this.observerCallback);

    // Force the lyrics tab to be enabled at all times.
    this.observer.disconnect();
    this.observer.observe(header, { attributes: true });
    header.removeAttribute('disabled');
  },

  async start({ getConfig, ipc: { on } }) {
    config = await getConfig();

    initLyricsStyle();

    on('ytmd:update-song-info', (extractedSongInfo: SongInfo) => {
      unregister?.();
      newSongReset();

      const tabList = document.querySelectorAll<HTMLElement>('tp-yt-paper-tab');
      const tabs = {
        upNext: tabList[0],
        lyrics: tabList[1],
        discover: tabList[2],
      };

      if (tabs.lyrics?.ariaDisabled) songWithLyrics = false;

      timeout = setTimeout(
        async () => {
          lyrics = await makeLyricsRequest(extractedSongInfo);
          if (!songWithLyrics && !lyrics) {
            // Delete previous lyrics if tab is open and couldn't get new lyrics
            tabs.upNext.click();
            return;
          }

          const tryToInjectLyric = (callback?: () => void) => {
            let lyricsContainer: Element | null = null;
            if (songWithLyrics) {
              lyricsContainer = document.querySelector(
                // Already has lyrics
                '#tab-renderer > ytmusic-section-list-renderer[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"] > div#contents',
              );
            } else {
              lyricsContainer = document.querySelector(
                // No lyrics available from Youtube
                '[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"] > ytmusic-message-renderer',
              );
            }

            if (lyricsContainer) {
              callback?.();
              setLyrics(lyricsContainer, lyrics);
            }
          };

          const lyricsTabHandler = () => {
            const tabContainer = document.querySelector('ytmusic-tab-renderer');
            if (!tabContainer) return;

            const observer = new MutationObserver((_, observer) => {
              tryToInjectLyric(() => observer.disconnect());
            });

            observer.observe(tabContainer, {
              attributes: true,
              childList: true,
              subtree: true,
            });
          };

          tabs.lyrics.addEventListener('click', lyricsTabHandler);

          tryToInjectLyric();

          unregister = () => {
            tabs.lyrics.removeEventListener('click', lyricsTabHandler);
          };
        },
        songWithLyrics ? 0 : 1000,
      );
    });

    createProgressEvents(on);
  },
});
