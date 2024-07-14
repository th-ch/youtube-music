import style from './style.css?inline';
import { createPlugin } from '@/utils';
import { menuContent } from './menu';
import { onRendererLoad } from './renderer/renderer';
import { net } from 'electron';
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
  addedVersion: '3.4.X',
  config: {
    enabled: false,
    preciseTiming: true,
    showLyricsEvenIfInexact: true,
    showTimeCodes: false,
    defaultTextString: '♪',
    lineEffect: 'scale',
  } as SyncedLyricsPluginConfig,
  stylesheets: [style],
  menu: menuContent,
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


      ipc.on('synced-lyrics:getPlainLyrics', async (query: string) => {
        let response = await net.fetch(`https://genius.com/api/search/multi?per_page=5&q=${query}`);
        if (!response.ok) return null;
        
        let data = await response.json();

        let song = (data as any).response.sections[0].hits[0].result;
        let url = song.url;

        response = await net.fetch(url);
        if (!response.ok) return null;

        let html = await response.text();
        //let parser = new DOMParser();
        // let doc = parser.parseFromString(html, 'text/html');
        // let lyrics = doc.querySelectorAll('div[data-lyrics-container]');
        // if (!lyrics.length) return null;
        // let lyricsText = lyrics[0].textContent;

        // Use a regular expression to find the lyrics container
        let lyricsMatch = html.match(/<div data-lyrics-container[^>]*>([\s\S]*?)<\/div>/);
        if (!lyricsMatch) return null;

        // Extract the text content from the matched lyrics container
        let lyricsContainer = lyricsMatch[1];
        

        // Remove any HTML tags from the lyrics container
        let lyricsText = lyricsContainer.replace(/<[^>]+>/g, '\n').trim();

        // Remove any empty lines from the lyrics array
        lyricsText = lyricsText.replace(/^\s*[\r\n]/gm, '');

        console.log(lyricsContainer,lyricsText);

        //make lyricsText into an array of lines
        let lyricsArray = lyricsText.split('\n');


        //Remove every [ and ] character from the lyricsArray, as well as any text that comes between them
        lyricsArray = lyricsArray.map(line => line.replace(/\[.*?\]/g, ''));

        
        console.log(lyricsArray);

        // if (!lyricsText) return null;

        // console.log(lyricsText);

        // let html = await response.text();
        // let parser = new DOMParser();
        //ipc.send('synced-lyrics:plainLyrics', lyricsText);
      });
    
    },
  },
  renderer: onRendererLoad,
});

