import style from './style.css?inline';
import { createPlugin } from '@/utils';
import { RendererContext } from '@/types/contexts';
import { SongInfo } from '@/providers/song-info';
// import { onMainLoad } from './main';
// import { t } from '@/i18n';

export type SyncedLyricsPluginConfig = {
  enabled: boolean;
  preciseTiming: boolean;
  noTextString: string;
};

export type LineLyricsStatus = 'previous' | 'current' | 'upcoming';

export type LineLyrics = {
  index: number;
  time: string;
  timeInMs: number;
  text: string;
  status: LineLyricsStatus
};

export type PlayPauseEvent = {
  isPaused: boolean;
  elapsedSeconds: number;
};

export default createPlugin({
  name: () => 'Synced Lyrics',
  description: () => 'Synced Lyrics Plugin Description',
  restartNeeded: true,
  config: {
    enabled: true,
    preciseTiming: true,
    noTextString: '♪',
  } as SyncedLyricsPluginConfig,
  stylesheets: [style],
  async menu({ getConfig, setConfig }) {
    const config = await getConfig();

    return [
      {
        label: 'Make the lyrics perfectly synced',
        toolTip: '(can have a small performance impact)',
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
  backend: {
    async start({ ipc }) {

      ipc.on('ytmd:player-api-loaded', () =>
        ipc.send('ytmd:setup-time-changed-listener'),
      );
      
      ipc.on('ytmd:time-changed', (t: number) => {
        ipc.send('synced-lyrics:setTime', t);
      });

      ipc.on('ytmd:play-or-paused', (data: object) => {
        ipc.send('synced-lyrics:paused', data);
      });
    
    },
    onConfigChange: () => {
      console.warn('Synced Lyrics Plugin Config Changed HEREEEEEEEEEEEE')
    }
  },

  renderer: async ({
    getConfig,
    ipc: { on, invoke },
  }: RendererContext<SyncedLyricsPluginConfig>) => {

  
    //let unregister: (() => void) | null = null;

    on('synced-lyrics:print', (t: string) => console.log(t));

    const config = await getConfig();

    let syncedLyricList: Array<LineLyrics> = [];
    let currentLyric: LineLyrics | null = null;
    let nextLyric: LineLyrics | null = null;

    const extractTimeAndText = (line: string, index: number): LineLyrics|null => {
      const match = /\[(\d+):(\d+)\.(\d+)\](.+)/.exec(line);
      if (!match) return null;

      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3]);
      const text = match[4] === ' ' ? config.noTextString : match[4].slice(1);
      
      const time = `${minutes}:${seconds}:${milliseconds}`;
      const timeInMs = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;

      return {
        index,
        time,
        timeInMs,
        text,
        status: 'upcoming',
      }as LineLyrics;
    }

    const makeLyricsRequest = async (extractedSongInfo: SongInfo): Promise<Array<LineLyrics> | null>  => {
      const songTitle = `${extractedSongInfo.title}`;
      const songArtist = `${extractedSongInfo.artist}`;
      const songAlbum = extractedSongInfo.album ? `${extractedSongInfo.album}` : undefined;
      
      return await getLyricsList(songTitle, songArtist, songAlbum);
    }
    
    const getLyricsList = async (songTitle: string, songArtist: string, songAlbum: string|undefined): Promise<Array<LineLyrics> | null> => {

      let url =  `https://lrclib.net/api/search?artist_name=${encodeURIComponent(songArtist)}&track_name=${encodeURIComponent(songTitle)}`
      if (songAlbum !== undefined) url += `&album_name=${encodeURIComponent(songAlbum)}`;

      console.log(url);

      const response = await fetch(url);
      if (!response.ok)
        return null;

      return await response.json().then((data: any) => { 
        let dataIndex: number = 0;
        if (!data.length) return null;

        for (let i = 0; i < data.length; i++) {
          if (data[i].syncedLyrics && !data[i].instrumental) {
            dataIndex = i;
            break;
          }
          return null;
        }

        if (data[dataIndex].instrumental) return null;

        let raw = data[dataIndex].syncedLyrics.split('\n') //Separate the lyrics into lines
        raw.unshift('[0:0.0] ') //Add a blank line at the beginning
        raw.forEach((line: string, index: number) => {
          const syncedLyrics = extractTimeAndText(line, index);
          if (syncedLyrics !== null) syncedLyricList.push(syncedLyrics);
        });

        return syncedLyricList;
      });
    };

    const secToMilisec = (t: number) => Math.round(Number(t) * 1e3);
    let currentTime = 0;
    let interval: NodeJS.Timeout | null = null;
    
    on('synced-lyrics:paused', (data: PlayPauseEvent) => {
      if (data.isPaused) 
        clearInterval(interval!);
    });

    on('synced-lyrics:setTime', (t: number) => {


      if (config.preciseTiming) {
        currentTime = secToMilisec(t);
        clearInterval(interval!);
        interval = setInterval(() => {

          currentTime += 10;
          changeActualLyric(currentTime);

        }, 10);
      } 
      else {
        clearInterval(interval!);
        currentTime = secToMilisec(t);
        changeActualLyric(currentTime);
      }
    });

    const changeActualLyric = (time: number): LineLyrics|void => {
      if (!syncedLyricList.length) return;
      
      if (!currentLyric) {
        currentLyric = syncedLyricList[0];
        nextLyric = syncedLyricList[1];
        currentLyric.status = 'current';
        console.log(currentLyric);
        return;
      }

      if (nextLyric && time >= nextLyric.timeInMs) {
        currentLyric.status = 'previous';
        currentLyric = nextLyric;
        nextLyric = syncedLyricList[currentLyric.index + 1];
        currentLyric.status = 'current';
        console.log(currentLyric);
        return;
      }

      //if time is before curent lyric time, replace the current lyric with the lyric associated with the acutal time
      if (time < currentLyric.timeInMs - 300) {
        for (let i = syncedLyricList.length - 1; i >= 0; i--) {
          syncedLyricList[i].status = 'upcoming';

          if (syncedLyricList[i].timeInMs < time) {
            currentLyric.status = 'previous';
            currentLyric = syncedLyricList[i];
            nextLyric = syncedLyricList[i + 1];
            currentLyric.status = 'current';
            console.log(currentLyric);
            return;
          }
        }

        console.log(syncedLyricList);
      }

    }
      
    
    

    
    const setLyrics = (lyricsContainer: Element, lyrics: Array<LineLyrics> | null) => {
      let lineList = [];
      if (lyrics) {
        const footer = lyricsContainer.querySelector('.footer');

        for(let i = 0; i < syncedLyricList.length; i++) {
          const line = syncedLyricList[i];
          lineList.push(`
            <div class="line ${line.status}" data-index="${line.index}">
              <span class="time">${line.time}</span>
              <span class="text">${line.text}</span>
            </div>
          `);
        }

        lyricsContainer.innerHTML = `
          <div id="contents" class="style-scope ytmusic-section-list-renderer description ytmusic-description-shelf-renderer synced-lyrics">
            ${
              // lyrics?.replaceAll(/\r\n|\r|\n/g, '<br/>') ??
              // 'Could not retrieve lyrics from genius'
              lineList.join('')
            }
          </div>
          <yt-formatted-string class="footer style-scope ytmusic-description-shelf-renderer" style="align-self: baseline">
          </yt-formatted-string>
        `;

        if (footer) 
          footer.textContent = 'Source: LRCLIB';
      }
    };

    /* on('ytmd:update-song-info', async (extractedSongInfo: SongInfo) => {
      syncedLyricList = [];
      currentLyric = null;
      nextLyric = null;

      setTimeout(async () => {
        const p = await makeLyricsRequest(extractedSongInfo);
        console.log(p);
      }, 500);
    }); */

    let unregister: (() => void) | null = null;
    let timeout: NodeJS.Timeout | null = null;
  
    on('ytmd:update-song-info', (extractedSongInfo: SongInfo) => {
      unregister?.();

      clearTimeout(timeout!);
      syncedLyricList = [];
      currentLyric = null;
      nextLyric = null;

      let songWithLyrics: boolean = true;
      const tabList = document.querySelectorAll<HTMLElement>('tp-yt-paper-tab');
      const tabs = {
        upNext: tabList[0],
        lyrics: tabList[1],
        discover: tabList[2],
      };

      // If not disabled, return (if enabled, return)
      //if (!tabs.lyrics?.hasAttribute('disabled')) return;

      if (tabs.lyrics?.getAttribute('aria-disabled') === 'true') songWithLyrics = false;
  
      timeout = setTimeout(async () => {
        // let songWithLyrics: boolean = true;
        // const tabList = document.querySelectorAll<HTMLElement>('tp-yt-paper-tab');
        // const tabs = {
        //   upNext: tabList[0],
        //   lyrics: tabList[1],
        //   discover: tabList[2],
        // };
  
        // If not disabled, return (if enabled, return)
        //if (!tabs.lyrics?.hasAttribute('disabled')) return;

        // if (tabs.lyrics?.getAttribute('aria-disabled') === 'true') songWithLyrics = false;
  
        // const lyrics = (await invoke(
        //   'search-genius-lyrics',
        //   extractedSongInfo,
        // )) as string | null;

        const lyrics = await makeLyricsRequest(extractedSongInfo);
        console.log("LYRICS", lyrics);

        //const lyrics = 'BONJOUR\nLES\nAMIS\nDE\nLA\nMUSIQUE\n♥'
        //const lyrics = null;
  
        if (!lyrics) {
          // Delete previous lyrics if tab is open and couldn't get new lyrics
          tabs.upNext.click();
  
          return;
        }
  
        const tryToInjectLyric = (callback?: () => void) => {
          console.log('tryToInjectLyric');

          let lyricsContainer: Element | null = null;
          console.log(songWithLyrics);
          if (songWithLyrics) {
            lyricsContainer = document.querySelector( // Already has lyrics
              //'[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"].ytmusic-tab-renderer > .ytmusic-description-shelf-renderer[split-line]',
              //'ytmusic-section-list-renderer[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"].ytmusic-tab-renderer > .ytmusic-section-list-renderer',
              //'ytmusic-tab-renderer > ytmusic-section-list-renderer[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"].ytmusic-tab-renderer',
              '#tab-renderer > ytmusic-section-list-renderer[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"]'
              //'#tab-renderer'
            );
          } 
          else {
            lyricsContainer = document.querySelector( // No lyrics available from Youtube
              '[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"] > ytmusic-message-renderer',
            );
          }

          //ytmusic-tab-renderer

          /*<yt-formatted-string class="non-expandable description style-scope ytmusic-description-shelf-renderer" split-lines=""> </yt-formatted-string> */

          console.log(lyricsContainer);
  
          if (lyricsContainer) {
            callback?.();
  
            setLyrics(lyricsContainer, lyrics);
            applyLyricsTabState();
          }
        };
        
        const applyLyricsTabState = () => {
          console.log('applyLyricsTabState');
          if (lyrics) {
            // tabs.lyrics.setAttribute('disabled', 'false');
            tabs.lyrics.setAttribute('aria-disabled', 'false');
            tabs.lyrics.removeAttribute('disabled');
            //tabs.lyrics.removeAttribute('aria-disabled');
          } else {
            tabs.lyrics.setAttribute('disabled', 'true');
            tabs.lyrics.setAttribute('aria-disabled', 'true');
          }
        };
  
        const lyricsTabHandler = () => {
          console.log('lyrics tab clicked');
          const tabContainer = document.querySelector('ytmusic-tab-renderer');
          console.log(tabContainer);
          if (!tabContainer) return;

          /* if (lyrics) {
            tabs.lyrics.removeAttribute('disabled');
            tabs.lyrics.removeAttribute('aria-disabled');
          } else {
            tabs.lyrics.setAttribute('disabled', '');
            tabs.lyrics.setAttribute('aria-disabled', '');
          } */
  
          const observer = new MutationObserver((_, observer) => {
            tryToInjectLyric(() => observer.disconnect());
          });
  
          observer.observe(tabContainer, {
            attributes: true,
            childList: true,
            subtree: true,
          });
        };
  
        //applyLyricsTabState();
  
        tabs.discover.addEventListener('click', () => {
          console.log('discover clicked');
          applyLyricsTabState();
          
        });
        tabs.lyrics.addEventListener('click', () => {
          console.log('lyrics clicked');
          lyricsTabHandler();
          
        });
        tabs.upNext.addEventListener('click', () => {
          console.log('upNext clicked');
          applyLyricsTabState();
          
        });

        const removeAllEventListeners = (element: HTMLElement) => {
          let clonedElement = element.cloneNode(true);
          element.parentNode!.replaceChild(clonedElement, element); // Replace the original element with the clone
          return clonedElement;
        }
        
  
        tryToInjectLyric();
  
        unregister = () => {
          console.warn('unregistered');
          tabs.discover.removeEventListener('click', applyLyricsTabState);
          tabs.lyrics.removeEventListener('click', lyricsTabHandler);
          tabs.upNext.removeEventListener('click', applyLyricsTabState);
          // removeAllEventListeners(tabs.discover);
          // removeAllEventListeners(tabs.lyrics);
          // removeAllEventListeners(tabs.upNext);
        };
      }, 1);

    });
    
  }
  
});

