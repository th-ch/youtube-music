import { RendererContext } from "@/types/contexts";
import { LineLyrics, SyncedLyricsPluginConfig } from "..";
import { SongInfo } from "@/providers/song-info";
import { createProgressEvents, interval, resetAllVariables } from "./lyrics/progress";
import { makeLyricsRequest } from "./lyrics/fetch";
import { initLyricsStyle, setLyrics } from "./lyrics/insert";

export const secToMilisec = (t: number) => Math.round(Number(t) * 1e3);
export let syncedLyricList: Array<LineLyrics> = [];
export let hadSecondAttempt: boolean = false;
export let config: SyncedLyricsPluginConfig;
export let lyrics: Array<LineLyrics> | null;
export let songWithLyrics: boolean = true;
let unregister: (() => void) | null = null;
let timeout: NodeJS.Timeout | null = null;

const newSongReset = () => {
    clearTimeout(timeout!);
    clearInterval(interval!);
    syncedLyricList = [];
    hadSecondAttempt = false;
    lyrics = null;
    songWithLyrics = true;
    resetAllVariables();
}

export const onRendererLoad = async ({
    getConfig,
    ipc: { on },
  }: RendererContext<SyncedLyricsPluginConfig>) => {
    config = await getConfig(); //make config global

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

      if (tabs.lyrics?.getAttribute('aria-disabled') === 'true') songWithLyrics = false;

      timeout = setTimeout(async () => {
        lyrics = await makeLyricsRequest(extractedSongInfo);
        if (!songWithLyrics && !lyrics) { // Delete previous lyrics if tab is open and couldn't get new lyrics
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
            tabs.discover.removeEventListener('click', applyLyricsTabState);
            tabs.lyrics.removeEventListener('click', lyricsTabHandler);
            tabs.upNext.removeEventListener('click', applyLyricsTabState);
        };
      }, songWithLyrics ? 0 : 1000);
    });

    createProgressEvents(on); 

};