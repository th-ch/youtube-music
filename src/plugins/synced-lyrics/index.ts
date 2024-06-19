import style from './style.css?inline';
import { createPlugin } from '@/utils';
import { RendererContext } from '@/types/contexts';
import { SongInfo } from '@/providers/song-info';
import { send } from 'vite';
import { c, i, s } from 'vite/dist/node/types.d-aGj9QkWt';
// import { onMainLoad } from './main';
// import { t } from '@/i18n';

export type SyncedLyricsPluginConfig = {
  enabled: boolean;
  preciseTiming: boolean;
};

export type LineLyrics = {
  index: number;
  time: string;
  timeInMs: number;
  text: string;
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
    /* async start({ ipc, getConfig }) {
      const config = await getConfig();

      let syncedLyricList: Array<LineLyrics> = [];
      let currentLyric: LineLyrics | null = null;
      let nextLyric: LineLyrics | null = null;

      const extractTimeAndText = (line: string, index: number): LineLyrics|null => {
        const match = /\[(\d+):(\d+):(\d+)\] (.+)/.exec(line);
        if (!match) return null;

        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const milliseconds = parseInt(match[3]);
        const text = match[4];
        
        const time = `${minutes}:${seconds}:${milliseconds}`;
        const timeInMs = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;

        return {
          index,
          time,
          timeInMs,
          text,
        }as LineLyrics;
      }

      const makeLyricsRequest = async (extractedSongInfo: SongInfo): Promise<Array<LineLyrics> | null>  => {

        const songTitle = `${extractedSongInfo.title}`;
        const songArtist = `${extractedSongInfo.artist}`;

        ipc.send('synced-lyrics:print', `Song Title: ${songTitle}, Song Artist: ${songArtist}`);
  
        return await getLyricsList(songTitle, songArtist);
      }
      
      const getLyricsList = async (songTitle: string, songArtist: string): Promise<Array<LineLyrics> | null> => {
  
        ipc.send('synced-lyrics:print', `https://lrclib.net/api/search?artist_name=${encodeURIComponent(songArtist)}&track_name=${encodeURIComponent(songTitle)}`);
        const response = await fetch(
          `https://lrclib.net/api/search?artist_name=${encodeURIComponent(songArtist)}&track_name=${encodeURIComponent(songTitle)}`,
        );
        if (!response.ok)
          return null;
  
        return await response.json().then((data: any) => {
          ipc.send('synced-lyrics:print', `Response: ${data}`);  
          if (data.length === 0) return null;

          data[0]['syncedLyrics'].forEach((line: string, index: number) => {
            const syncedLyrics = extractTimeAndText(line, index);
            if (syncedLyrics)
              syncedLyricList.push(syncedLyrics);
          });

          return syncedLyricList;
          
        });
      };

      ipc.on('ytmd:update-song-info', async (extractedSongInfo: SongInfo) => {
        console.log("Song Info: ", extractedSongInfo);
        ipc.send('synced-lyrics:print', extractedSongInfo);

        const p = await makeLyricsRequest(extractedSongInfo);

        ipc.send('synced-lyrics:print', p);   
      });


      const secToMilisec = (t: number) => Math.round(Number(t) * 1e3);
      let currentTime = 0;
      let interval: NodeJS.Timeout | null = null;

      ipc.on('ytmd:player-api-loaded', () =>
        ipc.send('ytmd:setup-time-changed-listener'),
      );
      
      ipc.on('ytmd:time-changed', (t: number) => {

        if (config.preciseTiming) {
          currentTime = secToMilisec(t);
          clearInterval(interval!);
          interval = setInterval(() => {

            currentTime += 10;
            changeActualLyric(currentTime);
            console.log(currentTime);

          }, 10);
        } 
        else {
          clearInterval(interval!);
          currentTime = secToMilisec(t);
          changeActualLyric(currentTime);
          console.log(currentTime);
        }

      });

      const changeActualLyric = (time: number): LineLyrics|void => {
        
        if (!currentLyric) {
          currentLyric = syncedLyricList[0];
          nextLyric = syncedLyricList[1];
          ipc.send('synced-lyrics:print', currentLyric);
          return;
        }

        if (nextLyric && time >= nextLyric.timeInMs) {
          currentLyric = nextLyric;
          nextLyric = syncedLyricList[currentLyric.index + 1];
          //console.log(currentLyric.text);
          ipc.send('synced-lyrics:print', currentLyric);
          return;
        }

      }
      
    
    }, */
    onConfigChange: () => {
      console.warn('Synced Lyrics Plugin Config Changed HEREEEEEEEEEEEE')
    }
  },

  renderer: async ({
    getConfig,
    ipc: { /* invoke, */ on, send },
  }: RendererContext<SyncedLyricsPluginConfig>) => {

  
    //let unregister: (() => void) | null = null;

    on('synced-lyrics:print', (t: string) => console.log(t));

    const config = await getConfig();

    let syncedLyricList: Array<LineLyrics> = [];
    let currentLyric: LineLyrics | null = null;
    let nextLyric: LineLyrics | null = null;

    const extractTimeAndText = (line: string, index: number): LineLyrics|null => {
      const match = /\[(\d+):(\d+)\.(\d+)\] (.+)/.exec(line);
      if (!match) return null;

      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3]);
      const text = match[4];
      
      const time = `${minutes}:${seconds}:${milliseconds}`;
      const timeInMs = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;

      return {
        index,
        time,
        timeInMs,
        text,
      }as LineLyrics;
    }

    const makeLyricsRequest = async (extractedSongInfo: SongInfo): Promise<Array<LineLyrics> | null>  => {
      const songTitle = `${extractedSongInfo.title}`;
      const songArtist = `${extractedSongInfo.artist}`;
      
      return await getLyricsList(songTitle, songArtist);
    }
    
    const getLyricsList = async (songTitle: string, songArtist: string): Promise<Array<LineLyrics> | null> => {

      const response = await fetch(
        `https://lrclib.net/api/search?artist_name=${encodeURIComponent(songArtist)}&track_name=${encodeURIComponent(songTitle)}`,
      );
      if (!response.ok)
        return null;

      return await response.json().then((data: any) => { 
        if (data.length === 0) return null;
        if (data[0].instrumental) return null;

        data[0].syncedLyrics.split('\n').forEach((line: string, index: number) => {
          const syncedLyrics = extractTimeAndText(line, index);
          if (syncedLyrics !== null) syncedLyricList.push(syncedLyrics);
        });

        return syncedLyricList;
      });
    };

    on('ytmd:update-song-info', async (extractedSongInfo: SongInfo) => {
      syncedLyricList = [];
      currentLyric = null;
      nextLyric = null;

      setTimeout(async () => {
        const p = await makeLyricsRequest(extractedSongInfo);
        console.log(p);
      }, 500);
    });


    const secToMilisec = (t: number) => Math.round(Number(t) * 1e3);
    let currentTime = 0;
    let interval: NodeJS.Timeout | null = null;

    on('ytmd:player-api-loaded', () =>
      send('ytmd:setup-time-changed-listener'),
    );
    
    on('ytmd:time-changed', (t: number) => {
      console.log(t);

      if (config.preciseTiming) {
        currentTime = secToMilisec(t);
        clearInterval(interval!);
        interval = setInterval(() => {

          currentTime += 10;
          changeActualLyric(currentTime);
          console.log(currentTime);

        }, 10);
      } 
      else {
        clearInterval(interval!);
        currentTime = secToMilisec(t);
        changeActualLyric(currentTime);
        console.log(currentTime);
      }

    });

    const changeActualLyric = (time: number): LineLyrics|void => {
      
      if (!currentLyric) {
        currentLyric = syncedLyricList[0];
        nextLyric = syncedLyricList[1];
        // send('synced-lyrics:print', currentLyric);
        console.log(currentLyric);
        return;
      }

      if (nextLyric && time >= nextLyric.timeInMs) {
        currentLyric = nextLyric;
        nextLyric = syncedLyricList[currentLyric.index + 1];
        console.log(currentLyric);
        //send('synced-lyrics:print', currentLyric);
        return;
      }

    }
      
    
    

    
    //on('ytmd:update-song-info', async (extractedSongInfo: SongInfo) => {

      //console.log(extractedSongInfo);

      //unregister?.();

      //console.log(await makeLyricsRequest(extractedSongInfo))


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
    //});

    
    
  }
  
});

