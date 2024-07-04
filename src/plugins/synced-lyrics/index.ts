import style from './style.css?inline';
import { createPlugin } from '@/utils';
import { MenuContext, RendererContext } from '@/types/contexts';
import { SongInfo } from '@/providers/song-info';
import { BrowserWindow, MenuItemConstructorOptions } from 'electron';// import { onMainLoad } from './main';
// import { t } from '@/i18n';

export type SyncedLyricsPluginConfig = {
  enabled: boolean;
  preciseTiming: boolean;
  showTimeCodes: boolean;
  defaultTextString: string;
  showLyricsEvenIfInexact: boolean;
  lineEffect: LineEffect;
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


export type LineEffect = 'scale' | 'offset' | 'focus';

export default createPlugin({
  name: () => 'Synced Lyrics',
  description: () => 'Synced Lyrics Plugin Description',
  authors: ['Non0reo'],
  restartNeeded: true,
  config: {
    enabled: true,
    preciseTiming: true,
    showLyricsEvenIfInexact: true,
    showTimeCodes: false,
    defaultTextString: '♪',
    lineEffect: 'scale',
  } as SyncedLyricsPluginConfig,
  stylesheets: [style],
  async menu({ getConfig, setConfig }: MenuContext<SyncedLyricsPluginConfig>): Promise<MenuItemConstructorOptions[]> {
    const config = await getConfig();
  
    return [
      {
        label: 'Make the lyrics perfectly synced',
        toolTip: 'Calculate to the milisecond the display of the next line (can have a small impact on performance)',
        type: 'checkbox',
        checked: config.preciseTiming,
        click(item) {
          setConfig({
            preciseTiming: item.checked,
          });
        },
      },
      {
        label: 'Show time codes',
        toolTip: 'Show the time codes next to the lyrics',
        type: 'checkbox',
        checked: config.showTimeCodes,
        click(item) {
          setConfig({
            showTimeCodes: item.checked,
          });
        },
      },
      {
        label: 'Show lyrics even if inexact',
        toolTip: 'If the song is not found, the plugin tries again with a different search query.\nThe result from the second attempt may not be exact.',
        type: 'checkbox',
        checked: config.showLyricsEvenIfInexact,
        click(item) {
          setConfig({
            showLyricsEvenIfInexact: item.checked,
          });
        },
      },
      {
        label: 'Line effect',
        toolTip: 'Choose the effect to apply to the current line',
        type: 'submenu',
        submenu: [
          {
            label: 'Scale',
            toolTip: 'Scale the current line',
            type: 'radio',
            checked: config.lineEffect === 'scale',
            click() {
              setConfig({
                lineEffect: 'scale',
              });
            },
          },
          {
            label: 'Offset',
            toolTip: 'Offset on the right the current line',
            type: 'radio',
            checked: config.lineEffect === 'offset',
            click() {
              setConfig({
                lineEffect: 'offset',
              });
            },
          },
          {
            label: 'Focus',
            toolTip: 'Make only the current line white',
            type: 'radio',
            checked: config.lineEffect === 'focus',
            click() {
              setConfig({
                lineEffect: 'focus',
              });
            },
          },
        ],
      },
      {
        label: 'Default character between lyrics',
        toolTip: 'Choose the default string to use for the gap between lyrics',
        type: 'submenu',
        submenu: [
          {
            label: '♪',
            type: 'radio',
            checked: config.defaultTextString === '♪',
            click() {
              setConfig({
                defaultTextString: '♪',
              });
            },
          },
          {
            label: '[SPACE]',
            type: 'radio',
            checked: config.defaultTextString === ' ',
            click() {
              setConfig({
                defaultTextString: ' ',
              });
            },
          },
          {
            label: '...',
            type: 'radio',
            checked: config.defaultTextString === '...',
            click() {
              setConfig({
                defaultTextString: '...',
              });
            },
          },
          {
            label: '———',
            type: 'radio',
            checked: config.defaultTextString === '———',
            click() {
              setConfig({
                defaultTextString: '———',
              });
            },
          },
          {
            label: '[BACKSPACE]',
            type: 'radio',
            checked: config.defaultTextString === '\n',
            click() {
              setConfig({
                defaultTextString: '\n',
              });
            },
          },
        ],
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
  },

  renderer: async ({
    getConfig,
    ipc: { on },
  }: RendererContext<SyncedLyricsPluginConfig>) => {
    const config = await getConfig();

    let root = document.documentElement;
    switch (config.lineEffect) {
      case 'scale':
        root.style.setProperty('--previous-lyrics', 'var(--ytmusic-text-primary)');
        root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
        root.style.setProperty('--upcoming-lyrics', 'var(--ytmusic-text-secondary)');
        root.style.setProperty('--size-lyrics', '1.2em');
        root.style.setProperty('--offset-lyrics', '0');
        break;
      case 'offset':
        root.style.setProperty('--previous-lyrics', 'var(--ytmusic-text-primary)');
        root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
        root.style.setProperty('--upcoming-lyrics', 'var(--ytmusic-text-secondary)');
        root.style.setProperty('--size-lyrics', '1em');
        root.style.setProperty('--offset-lyrics', '1em');
        break;
      case 'focus':
        root.style.setProperty('--previous-lyrics', 'var(--ytmusic-text-secondary)');
        root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
        root.style.setProperty('--upcoming-lyrics', 'var(--ytmusic-text-secondary)');
        root.style.setProperty('--size-lyrics', '1em');
        root.style.setProperty('--offset-lyrics', '0');
        break;
    }
    

    let syncedLyricList: Array<LineLyrics> = [];
    let currentLyric: LineLyrics | null = null;
    let nextLyric: LineLyrics | null = null;
    let hadSecondAttempt: boolean = false;
    let songInfos: SongInfo;

    const extractTimeAndText = (line: string, index: number): LineLyrics|null => {
      const match = /\[(\d+):(\d+)\.(\d+)\](.+)/.exec(line);
      if (!match) return null;

      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3]);
      const text = match[4] === ' ' ? config.defaultTextString : match[4].slice(1);
      
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
      const songDuration = extractedSongInfo.songDuration;
      
      return await getLyricsList(songTitle, songArtist, songAlbum, songDuration);
    }
    
    const getLyricsList = async (songTitle: string, songArtist: string, songAlbum: string|undefined, songDuration: number): Promise<Array<LineLyrics> | null> => {
      let url =  `https://lrclib.net/api/search?artist_name=${encodeURIComponent(songArtist)}&track_name=${encodeURIComponent(songTitle)}`
      if (songAlbum !== undefined) url += `&album_name=${encodeURIComponent(songAlbum)}`;

      const response = await fetch(url);
      if (!response.ok)
        return null;

      return await response.json().then(async (data: any) => { 
        let dataIndex: number = 0;
        if (!data.length && config.showLyricsEvenIfInexact) { //If no lyrics are found, try again with a different search query
          hadSecondAttempt = true;
          const secondResponse = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(songTitle)}`);
          if (!secondResponse.ok) return null;
          console.log('Second attempt');
          data = await secondResponse.json();
        }
        else if (!data.length) 
          return null;

        let songsWithMatchingArtist = data.filter((song: any) => songArtist.toLowerCase().includes(song.artistName.toLowerCase()) && song.syncedLyrics); //Lowercase to avoid case sensitivity from API
        console.log('song with matching artists', songsWithMatchingArtist);
        if (!songsWithMatchingArtist.length) return null;
        dataIndex = 0;
        if (songsWithMatchingArtist.length > 1) {
          for (let i = 0; i < songsWithMatchingArtist.length; i++) {
            if (Math.abs(songsWithMatchingArtist[i].duration - songDuration) < Math.abs(songsWithMatchingArtist[dataIndex].duration - songDuration)) {
              dataIndex = i;
            }
          }
        }

        data = songsWithMatchingArtist;

        console.log(data)
        console.log(dataIndex, data[dataIndex]);
        if (Math.abs(data[dataIndex].duration - songDuration) > 5) return null;

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
        styleLyrics(currentLyric);        
        return;
      }

      if (nextLyric && time >= nextLyric.timeInMs) {
        currentLyric.status = 'previous';
        currentLyric = nextLyric;
        nextLyric = syncedLyricList[currentLyric.index + 1];
        currentLyric.status = 'current';
        styleLyrics(currentLyric);
        return;
      }

      //if time is before curent lyric time, replace the current lyric with the lyric associated with the acutal time
      if (time < currentLyric.timeInMs - 300) {
        for (let i = syncedLyricList.length - 1; i >= 0; i--) {
          syncedLyricList[i].status = 'upcoming';

          if (syncedLyricList[i].timeInMs < time) {
            clearInterval(interval!);
            currentLyric.status = 'previous';
            currentLyric = syncedLyricList[i];
            nextLyric = syncedLyricList[i + 1];
            currentLyric.status = 'current';
            styleLyrics(currentLyric);
            return;
          }
        }
      }

    }
      
    
    //on('synced-lyrics:styleLyrics', (actualLyric: LineLyrics) => {
    const styleLyrics = (actualLyric: LineLyrics) => {
      const lyrics = document.querySelectorAll('.synced-line');
      
      const setStatus = (lyric: Element, status: LineLyricsStatus) => {
        lyric.classList.remove('current');
        lyric.classList.remove('previous');
        lyric.classList.remove('upcoming');
        lyric.classList.add(status);
      }

      lyrics.forEach((lyric: Element) => {
        const index = parseInt(lyric.getAttribute('data-index')!);
        if (index === actualLyric.index)
          setStatus(lyric, 'current');
        else if (index < actualLyric.index)
          setStatus(lyric, 'previous');
        else 
          setStatus(lyric, 'upcoming');
      });

      const targetElement = document.querySelector<HTMLElement>('.current');
      if (targetElement)
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
    };

    
    const setLyrics = (lyricsContainer: Element, lyrics: Array<LineLyrics> | null) => {
      let lineList = [];
      console.log(lyrics, lyricsContainer);
      if (lyrics) {
        const footer = lyricsContainer.querySelector('.footer');

        let lyricsBegin = syncedLyricList[1].timeInMs < 1000 ? 1 : 0; //If the first real lyric is before 1 second, we skip the first blank line
        for(let i = lyricsBegin; i < syncedLyricList.length; i++) {
          const line = syncedLyricList[i];
          lineList.push(`
            <div class="synced-line ${line.status}" data-index="${line.index}">
              <span class="text-lyrics">${config.showTimeCodes ? `[${line.time}] ` : ''}${line.text}</span>
            </div>
          `);
        }
        //<div id="contents" class="style-scope ytmusic-section-list-renderer description ytmusic-description-shelf-renderer synced-lyrics">
        lyricsContainer.innerHTML = `
          ${hadSecondAttempt ? '<div class="warning-lyrics">The lyrics for this song may not be exact</div>' : ''}
          ${lineList.join('')}
          <span class="footer style-scope ytmusic-description-shelf-renderer" style="align-self: baseline">Source: LRCLIB</span>
          <yt-formatted-string class="footer style-scope ytmusic-description-shelf-renderer" style="align-self: baseline">
            Source: LRCLIB
          </yt-formatted-string>
        `;
        lyricsContainer.classList.add('synced-lyrics');
        lyricsContainer.classList.add('description');

        if (footer) 
          footer.textContent = 'Source: LRCLIB';
      }
    };

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

      // If not disabled, return (if enabled, return)
      // if (!tabs.lyrics?.hasAttribute('disabled')) return;

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
          } 
          else {
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
            // const globalLyricsDiv = document.querySelector<HTMLElement>('#tab-renderer > ytmusic-section-list-renderer[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"]');
            // if (globalLyricsDiv) globalLyricsDiv.style.display = 'unset';
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
  
        tabs.discover.addEventListener('click', () => {
          applyLyricsTabState();
          
        });
        tabs.lyrics.addEventListener('click', () => {
          lyricsTabHandler();
          
        });
        tabs.upNext.addEventListener('click', () => {
          applyLyricsTabState();
          
        });        
  
        tryToInjectLyric();
  
        unregister = () => {
          console.warn('unregistered');
          tabs.discover.removeEventListener('click', applyLyricsTabState);
          tabs.lyrics.removeEventListener('click', lyricsTabHandler);
          tabs.upNext.removeEventListener('click', applyLyricsTabState);
        };
      }, songWithLyrics ? 0 : 1000);

    });
    
  }
  
});

