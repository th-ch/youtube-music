import { ipcRenderer } from 'electron';

import { singleton } from './decorators';
import { getImage, SongInfo } from './song-info';

import { YoutubePlayer } from '../types/youtube-player';
import { GetState } from '../types/datahost-get-state';
import { VideoDataChangeValue } from '../types/player-api-events';

let songInfo: SongInfo = {} as SongInfo;
export const getSongInfo = () => songInfo;

const $ = <E extends Element = Element>(s: string): E | null => document.querySelector<E>(s);
const $$ = <E extends Element = Element>(s: string): NodeListOf<E> => document.querySelectorAll<E>(s);

ipcRenderer.on('update-song-info', async (_, extractedSongInfo: SongInfo) => {
  songInfo = extractedSongInfo;
  if (songInfo.imageSrc) songInfo.image = await getImage(songInfo.imageSrc);
});

// Used because 'loadeddata' or 'loadedmetadata' weren't firing on song start for some users (https://github.com/th-ch/youtube-music/issues/473)
const srcChangedEvent = new CustomEvent('srcChanged');

export const setupSeekedListener = singleton(() => {
  $('video')?.addEventListener('seeked', (v) => {
    if (v.target instanceof HTMLVideoElement) {
      ipcRenderer.send('seeked', v.target.currentTime);
    }
  });
});

export const setupTimeChangedListener = singleton(() => {
  const progressObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target as Node & { value: string };
      ipcRenderer.send('timeChanged', target.value);
      songInfo.elapsedSeconds = Number(target.value);
    }
  });
  const progressBar = $('#progress-bar');
  if (progressBar) {
    progressObserver.observe(progressBar, { attributeFilter: ['value'] });
  }
});

export const setupRepeatChangedListener = singleton(() => {
  const repeatObserver = new MutationObserver((mutations) => {

    // provided by YouTube Music
    ipcRenderer.send(
      'repeatChanged',
      (mutations[0].target as Node & {
        __dataHost: {
          getState: () => GetState;
        }
      }).__dataHost.getState().queue.repeatMode,
    );
  });
  repeatObserver.observe($('#right-controls .repeat')!, { attributeFilter: ['title'] });

  // Emit the initial value as well; as it's persistent between launches.
  // provided by YouTube Music
  ipcRenderer.send(
    'repeatChanged',
    $<HTMLElement & {
      getState: () => GetState;
    }>('ytmusic-player-bar')?.getState().queue.repeatMode,
  );
});

export const setupVolumeChangedListener = singleton((api: YoutubePlayer) => {
  $('video')?.addEventListener('volumechange', () => {
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
      if (e.target instanceof HTMLVideoElement && Math.round(e.target.currentTime) > 0) {
        ipcRenderer.send('playPaused', {
          isPaused: status === 'pause',
          elapsedSeconds: Math.floor(e.target.currentTime),
        });
      }
    };

    const playPausedHandlers = {
      playing: (e: Event) => playPausedHandler(e, 'playing'),
      pause: (e: Event) => playPausedHandler(e, 'pause'),
    };

    const waitingEvent = new Set<string>();
    // Name = "dataloaded" and abit later "dataupdated"
    apiEvent.detail.addEventListener('videodatachange', (name: string, videoData) => {
      if (name === 'dataupdated' && waitingEvent.has(videoData.videoId)) {
        waitingEvent.delete(videoData.videoId);
        sendSongInfo(videoData);
      } else if (name === 'dataloaded') {
        const video = $<HTMLVideoElement>('video');
        video?.dispatchEvent(srcChangedEvent);

        for (const status of ['playing', 'pause'] as const) { // for fix issue that pause event not fired
          video?.addEventListener(status, playPausedHandlers[status]);
        }

        waitingEvent.add(videoData.videoId);
      }
    });

    const video = $('video')!;
    for (const status of ['playing', 'pause'] as const) {
      video.addEventListener(status, playPausedHandlers[status]);
    }

    function sendSongInfo(videoData: VideoDataChangeValue) {
      const data = apiEvent.detail.getPlayerResponse();

      data.videoDetails.album = videoData?.Hd?.playerOverlays?.playerOverlayRenderer?.browserMediaSession?.browserMediaSessionRenderer?.album.runs?.at(0)?.text;
      data.videoDetails.elapsedSeconds = 0;
      data.videoDetails.isPaused = false;
      ipcRenderer.send('video-src-changed', data);
    }
  }, { once: true, passive: true });
};
