import { ipcRenderer } from 'electron';

import { singleton } from './decorators';
import { getImage, SongInfo } from './song-info';

import { YoutubePlayer } from '../types/youtube-player';
import { GetState } from '../types/datahost-get-state';

let songInfo: SongInfo = {} as SongInfo;

const $ = <E extends HTMLElement>(s: string): E => document.querySelector(s) as E;
const $$ = <E extends HTMLElement>(s: string): E[] => [...document.querySelectorAll(s)!] as E[];

ipcRenderer.on('update-song-info', async (_, extractedSongInfo: string) => {
  songInfo = JSON.parse(extractedSongInfo) as SongInfo;
  if (songInfo.imageSrc) songInfo.image = await getImage(songInfo.imageSrc);
});

// Used because 'loadeddata' or 'loadedmetadata' weren't firing on song start for some users (https://github.com/th-ch/youtube-music/issues/473)
const srcChangedEvent = new CustomEvent('srcChanged');

export const setupSeekedListener = singleton(() => {
  $('video')?.addEventListener('seeked', (v) => ipcRenderer.send('seeked', (v.target as HTMLVideoElement).currentTime));
});

export const setupTimeChangedListener = singleton(() => {
  const progressObserver = new MutationObserver((mutations) => {
    const target = mutations[0].target as HTMLInputElement;
    ipcRenderer.send('timeChanged', target.value);
    songInfo.elapsedSeconds = Number(target.value);
  });
  progressObserver.observe($('#progress-bar'), { attributeFilter: ['value'] });
});

export const setupRepeatChangedListener = singleton(() => {
  const repeatObserver = new MutationObserver((mutations) => {

    // provided by YouTube music
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    ipcRenderer.send('repeatChanged', ((mutations[0].target as any).__dataHost.getState() as GetState).queue.repeatMode);
  });
  repeatObserver.observe($('#right-controls .repeat')!, { attributeFilter: ['title'] });

  // Emit the initial value as well; as it's persistent between launches.
  // provided by YouTube music
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unnecessary-type-assertion
  ipcRenderer.send('repeatChanged', (($('ytmusic-player-bar') as any).getState() as GetState).queue.repeatMode);
});

export const setupVolumeChangedListener = singleton((api: YoutubePlayer) => {
  $('video').addEventListener('volumechange', () => {
    ipcRenderer.send('volumeChanged', api.getVolume());
  });
  // Emit the initial value as well; as it's persistent between launches.
  ipcRenderer.send('volumeChanged', api.getVolume());
});

export default () => {
  document.addEventListener('apiLoaded', (apiEvent) => {
    ipcRenderer.on('setupTimeChangedListener', () => {
      setupTimeChangedListener();
    });

    ipcRenderer.on('setupRepeatChangedListener', () => {
      setupRepeatChangedListener();
    });

    ipcRenderer.on('setupVolumeChangedListener', () => {
      setupVolumeChangedListener(apiEvent.detail);
    });

    ipcRenderer.on('setupSeekedListener', () => {
      setupSeekedListener();
    });

    const playPausedHandler = (e: Event, status: string) => {
      if (Math.round((e.target as HTMLVideoElement).currentTime) > 0) {
        ipcRenderer.send('playPaused', {
          isPaused: status === 'pause',
          elapsedSeconds: Math.floor((e.target as HTMLVideoElement).currentTime),
        });
      }
    };

    const playPausedHandlers = {
      playing: (e: Event) => playPausedHandler(e, 'playing'),
      pause: (e: Event) => playPausedHandler(e, 'pause'),
    };

    // Name = "dataloaded" and abit later "dataupdated"
    apiEvent.detail.addEventListener('videodatachange', (name: string) => {
      if (name !== 'dataloaded') {
        return;
      }
      const video = $<HTMLVideoElement>('video');
      video.dispatchEvent(srcChangedEvent);

      for (const status of ['playing', 'pause'] as const) { // for fix issue that pause event not fired
        video.addEventListener(status, playPausedHandlers[status]);
      }
      setTimeout(sendSongInfo, 200);
    });

    const video = $('video')!;
    for (const status of ['playing', 'pause'] as const) {
      video.addEventListener(status, playPausedHandlers[status]);
    }

    function sendSongInfo() {
      const data = apiEvent.detail.getPlayerResponse();

      data.videoDetails.album = $$<HTMLAnchorElement>(
        '.byline.ytmusic-player-bar > .yt-simple-endpoint',
      ).find((e) =>
        e.href?.includes('browse/FEmusic_library_privately_owned_release')
        || e.href?.includes('browse/MPREb'),
      )?.textContent;

      data.videoDetails.elapsedSeconds = 0;
      data.videoDetails.isPaused = false;
      ipcRenderer.send('video-src-changed', JSON.stringify(data));
    }
  }, { once: true, passive: true });
};
