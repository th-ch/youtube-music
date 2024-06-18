import style from './style.css?inline';
import { createPlugin } from '@/utils';
import { RendererContext } from '@/types/contexts';
import { SongInfo } from '@/providers/song-info';
import config from '@/config';
// import { onMainLoad } from './main';
// import { t } from '@/i18n';

export type SyncedLyricsPluginConfig = {
  enabled: boolean;
  preciseTiming: boolean;
};

export default createPlugin({
  name: () => 'Synced Lyrics',
  description: () => 'Synced Lyrics Plugin Description',
  restartNeeded: true,
  config: {
    enabled: false,
    preciseTiming: true,
  } as SyncedLyricsPluginConfig,
  stylesheets: [style],
  async menu({ getConfig, setConfig }) {
    const config = await getConfig();

    return [
      {
        label: 'Make the lyrics perfectly synced (can have a small performance impact)',
        type: 'checkbox',
        checked: config.preciseTiming,
        click(item) {
          setConfig({
            preciseTiming: item.checked,
          });
        },
      },
    ];
  },

  /* backend: {
    start: () => {
      console.warn('Synced Lyrics Plugin Loaded OMGGGGGGGGGGGGG')
    },
    onConfigChange: () => {
      console.warn('Synced Lyrics Plugin Config Changed HEREEEEEEEEEEEE')
    }
  }, */
  //renderer: onRendererLoad,
  /* renderer: {
    onPlayerApiReady: async (playerApi, context) => {
      console.warn('Synced Lyrics Plugin Loaded OUIIIIIIIIIIII')
      console.log(playerApi, context)
    },
  }, */

  backend: {
    async start({ ipc, getConfig }) {
      const config = await getConfig();

      const makeLyricRequest = async (extractedSongInfo: SongInfo): Promise<string | null>  => {
      
        const songTitle = `${extractedSongInfo.title}`;
        const songArtist = `${extractedSongInfo.artist}`;
  
        return await getLyricsList(songTitle, songArtist);
      }
      
      const getLyricsList = async (songTitle: string, songArtist: string): Promise<string | null> => {
  
        const response = await fetch(
          `https://lrclib.net/api/search?artist_name=${encodeURIComponent(songArtist)}&track_name=${encodeURIComponent(songTitle)}`,
        );
        if (!response.ok)
          return null;
  
        return await response.json().then((data: any) => {
          return data.length != 0 ? data[0] : null;
        });
  
        //return null;
      };

      ipc.on('ytmd:update-song-info', async (extractedSongInfo: SongInfo) => {

        console.log(await makeLyricRequest(extractedSongInfo))

      });


      const secToMilisec = (t: number) => Math.round(Number(t) * 1e3);
      let currentTime = 0;
      let interval: NodeJS.Timeout | null = null;

      ipc.on('ytmd:player-api-loaded', () =>
        ipc.send('ytmd:setup-time-changed-listener'),
      );
      
      ipc.on('ytmd:time-changed', (t: number) => {
        currentTime = secToMilisec(t);

        if (config.preciseTiming) {
          clearInterval(interval!);
          interval = setInterval(() => {
            currentTime += 10;
            console.log(currentTime);
          }, 10);
        }

      });
    
    },
    onConfigChange: () => {
      console.warn('Synced Lyrics Plugin Config Changed HEREEEEEEEEEEEE')
    }
  },

  renderer: ({
    ipc: { /* invoke, */ on/* , send */ },
  }: RendererContext<SyncedLyricsPluginConfig>) => {


    const makeLyricRequest = async (extractedSongInfo: SongInfo): Promise<string | null>  => {
      
      const songTitle = `${extractedSongInfo.title}`;
      const songArtist = `${extractedSongInfo.artist}`;

      return await getLyricsList(songTitle, songArtist);
    }
    
    const getLyricsList = async (songTitle: string, songArtist: string): Promise<string | null> => {

      const response = await fetch(
        `https://lrclib.net/api/search?artist_name=${encodeURIComponent(songArtist)}&track_name=${encodeURIComponent(songTitle)}`,
      );
      if (!response.ok)
        return null;

      return await response.json().then((data: any) => {
        return data.length != 0 ? data[0] : null;
      });

      //return null;
    };
  
    //let unregister: (() => void) | null = null;

    
    on('ytmd:update-song-info', async (extractedSongInfo: SongInfo) => {

      //console.log(extractedSongInfo);

      //unregister?.();

      console.log(await makeLyricRequest(extractedSongInfo))


      /* setInterval(async () => {
        console.log(extractedSongInfo);
      }, 700); */
  

      // setTimeout(async () => {
      //   /* const tabList = document.querySelectorAll<HTMLElement>('tp-yt-paper-tab');
      //   const tabs = {
      //     upNext: tabList[0],
      //     lyrics: tabList[1],
      //     discover: tabList[2],
      //   };
        
  
      //   // Check if disabled
      //   if (!tabs.lyrics?.hasAttribute('disabled')) return; */
        
      //   // const lyrics = (await invoke(
      //   //   'search-synced-lyrics',
      //   //   extractedSongInfo,
      //   // )) as string | null;
  
      //   // if (!lyrics) {
      //   //   // Delete previous lyrics if tab is open and couldn't get new lyrics
      //   //   tabs.upNext.click();
  
      //   //   return;
      //   // }
  
      //   // if (window.electronIs.dev()) {
      //   //   console.log(
      //   //     LoggerPrefix,
      //   //     t('plugins.lyric-genius.renderer.fetched-lyrics'),
      //   //   );
      //   // }
  
      //   // p0: (playerApi: any) => Promise<void>const tryToInjectLyric = (callback?: () => void) => {
      //   //   const lyricsContainer = document.querySelector(
      //   //     '[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"] > ytmusic-message-renderer',
      //   //   );
  
      //   //   if (lyricsContainer) {
      //   //     callback?.();
  
      //   //     setLyrics(lyricsContainer, lyrics);
      //   //     applyLyricsTabState();
      //   //   }
      //   // };
      //   // const applyLyricsTabState = () => {
      //   //   if (lyrics) {
      //   //     tabs.lyrics.removeAttribute('disabled');
      //   //     tabs.lyrics.removeAttribute('aria-disabled');
      //   //   } else {
      //   //     tabs.lyrics.setAttribute('disabled', '');
      //   //     tabs.lyrics.setAttribute('aria-disabled', '');
      //   //   }
      //   // };
      //   // const lyricsTabHandler = () => {
      //   //   const tabContainer = document.querySelector('ytmusic-tab-renderer');
      //   //   if (!tabContainer) return;
  
      //   //   const observer = new MutationObserver((_, observer) => {
      //   //     tryToInjectLyric(() => observer.disconnect());
      //   //   });
  
      //   //   observer.observe(tabContainer, {
      //   //     attributes: true,
      //   //     childList: true,
      //   //     subtree: true,
      //   //   });
      //   // };
  
      //   // applyLyricsTabState();
  
      //   // tabs.discover.addEventListener('click', applyLyricsTabState);
      //   // tabs.lyrics.addEventListener('click', lyricsTabHandler);
      //   // tabs.upNext.addEventListener('click', applyLyricsTabState);
  
      //   // tryToInjectLyric();
  
      //   // unregister = () => {
      //   //   tabs.discover.removeEventListener('click', applyLyricsTabState);
      //   //   tabs.lyrics.removeEventListener('click', lyricsTabHandler);
      //   //   tabs.upNext.removeEventListener('click', applyLyricsTabState);
      //   // };
      // }, 500);
    });

    
    
  }
  
});
