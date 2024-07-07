import { RendererContext } from "@/types/contexts";
import { LineLyrics, SyncedLyricsPluginConfig } from "..";
import { SongInfo } from "@/providers/song-info";
import { createProgressEvents } from "./lyrics/progress";
import { makeLyricsRequest } from "./lyrics/fetch";
import { setLyrics } from "./lyrics/insert";


export const secToMilisec = (t: number) => Math.round(Number(t) * 1e3);
export let syncedLyricList: Array<LineLyrics> = [];
export let currentLyric: LineLyrics | null = null;
export let nextLyric: LineLyrics | null = null;
export let hadSecondAttempt: boolean = false;
export let songInfos: SongInfo;
export let currentTime = 0;
export let interval: NodeJS.Timeout | null = null;
export let config: SyncedLyricsPluginConfig;

export const onRendererLoad = async ({
    getConfig,
    ipc: { on },
  }: RendererContext<SyncedLyricsPluginConfig>) => {
    config = await getConfig(); //make config global

    createProgressEvents(on);


    let root = document.documentElement;
    switch (config.lineEffect) { // Set the line effect
      case 'scale':
      root.style.setProperty('--previous-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1.2em');
      root.style.setProperty('--offset-lyrics', '0');
      break;
      case 'offset':
      root.style.setProperty('--previous-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1em');
      root.style.setProperty('--offset-lyrics', '1em');
      break;
      case 'focus':
      root.style.setProperty('--previous-lyrics', 'var(--ytmusic-text-secondary)');
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1em');
      root.style.setProperty('--offset-lyrics', '0');
      break;
    }

        
    let unregister: (() => void) | null = null;
    let timeout: NodeJS.Timeout | null = null;
    let lyrics: Array<LineLyrics> | null = null;

    on('ytmd:update-song-info', (extractedSongInfo: SongInfo) => {
      songInfos = extractedSongInfo;
      unregister?.();

      clearTimeout(timeout!);
      syncedLyricList = [];
      currentLyric = null;
      nextLyric = null;
      hadSecondAttempt = false;
      lyrics = null;

      let songWithLyrics: boolean = true;
      const tabList = document.querySelectorAll<HTMLElement>('tp-yt-paper-tab');
      const tabs = {
        upNext: tabList[0],
        lyrics: tabList[1],
        discover: tabList[2],
      };

      if (tabs.lyrics?.getAttribute('aria-disabled') === 'true') songWithLyrics = false;

      timeout = setTimeout(async () => {
        lyrics = await makeLyricsRequest(songInfos);
        if (!lyrics) { // Delete previous lyrics if tab is open and couldn't get new lyrics
            tabs.upNext.click();
            return;
        }

        const tryToInjectLyric = (callback?: () => void) => {
          let lyricsContainer: Element | null = null;
          if (songWithLyrics) {
            lyricsContainer = document.querySelector( // Already has lyrics
                '#tab-renderer > ytmusic-section-list-renderer[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"] > div#contents'
            );
          } else {
            lyricsContainer = document.querySelector( // No lyrics available from Youtube
                '[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"] > ytmusic-message-renderer',
            );
          }

          if (lyricsContainer) {
              callback?.();

              setLyrics(lyricsContainer, lyrics);
              applyLyricsTabState();
          }
        };
        
        const applyLyricsTabState = () => {
          console.log(lyrics !== null, songWithLyrics, lyrics !== null || songWithLyrics);
          if (lyrics !== null || songWithLyrics) {
            tabs.lyrics.style.display = 'block'; //specific case where the lyrics are not available
            tabs.lyrics.removeAttribute('disabled');
            tabs.lyrics.setAttribute('aria-disabled', 'false');
          } else {
            tabs.lyrics.setAttribute('disabled', 'true');
            tabs.lyrics.setAttribute('aria-disabled', 'true');
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

        applyLyricsTabState();

        tabs.discover.addEventListener('click', applyLyricsTabState);
        tabs.lyrics.addEventListener('click', lyricsTabHandler);
        tabs.upNext.addEventListener('click', applyLyricsTabState);        

        tryToInjectLyric();

        unregister = () => {
            console.warn('unregistered');
            tabs.discover.removeEventListener('click', applyLyricsTabState);
            tabs.lyrics.removeEventListener('click', lyricsTabHandler);
            tabs.upNext.removeEventListener('click', applyLyricsTabState);
        };
      }, songWithLyrics ? 0 : 1000);

    });
    
};