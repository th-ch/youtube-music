import { singleton } from './decorators';

import type { YoutubePlayer } from '@/types/youtube-player';
import type { GetState } from '@/types/datahost-get-state';
import type { AlbumDetails, VideoDataChangeValue } from '@/types/player-api-events';

import type { SongInfo } from './song-info';
import type { VideoDataChanged } from '@/types/video-data-changed';

let songInfo: SongInfo = {} as SongInfo;
export const getSongInfo = () => songInfo;

const $ = <E extends Element = Element>(s: string): E | null =>
  document.querySelector<E>(s);

window.ipcRenderer.on('update-song-info', (_, extractedSongInfo: SongInfo) => {
  songInfo = extractedSongInfo;
});

// Used because 'loadeddata' or 'loadedmetadata' weren't firing on song start for some users (https://github.com/th-ch/youtube-music/issues/473)
const srcChangedEvent = new CustomEvent('ytmd:src-changed');

export const setupSeekedListener = singleton(() => {
  $('video')?.addEventListener('seeked', (v) => {
    if (v.target instanceof HTMLVideoElement) {
      window.ipcRenderer.send('ytmd:seeked', v.target.currentTime);
    }
  });
});

export const setupTimeChangedListener = singleton(() => {
  const progressObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target as Node & { value: string };
      window.ipcRenderer.send('ytmd:time-changed', target.value);
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
    window.ipcRenderer.send(
      'ytmd:repeat-changed',
      (
        mutations[0].target as Node & {
          __dataHost: {
            getState: () => GetState;
          };
        }
      ).__dataHost.getState().queue.repeatMode,
    );
  });
  repeatObserver.observe($('#right-controls .repeat')!, {
    attributeFilter: ['title'],
  });

  // Emit the initial value as well; as it's persistent between launches.
  // provided by YouTube Music
  window.ipcRenderer.send(
    'ytmd:repeat-changed',
    $<
      HTMLElement & {
        getState: () => GetState;
      }
    >('ytmusic-player-bar')?.getState().queue.repeatMode,
  );
});

export const setupVolumeChangedListener = singleton((api: YoutubePlayer) => {
  $('video')?.addEventListener('volumechange', () => {
    window.ipcRenderer.send('ytmd:volume-changed', api.getVolume());
  });
  // Emit the initial value as well; as it's persistent between launches.
  window.ipcRenderer.send('ytmd:volume-changed', api.getVolume());
});

export default (api: YoutubePlayer) => {
  window.ipcRenderer.on('ytmd:setup-time-changed-listener', () => {
    setupTimeChangedListener();
  });

  window.ipcRenderer.on('ytmd:setup-repeat-changed-listener', () => {
    setupRepeatChangedListener();
  });

  window.ipcRenderer.on('ytmd:setup-volume-changed-listener', () => {
    setupVolumeChangedListener(api);
  });

  window.ipcRenderer.on('ytmd:setup-seeked-listener', () => {
    setupSeekedListener();
  });

  const playPausedHandler = (e: Event, status: string) => {
    if (
      e.target instanceof HTMLVideoElement &&
      Math.round(e.target.currentTime) > 0
    ) {
      window.ipcRenderer.send('ytmd:play-or-paused', {
        isPaused: status === 'pause',
        elapsedSeconds: Math.floor(e.target.currentTime),
      });
    }
  };

  const playPausedHandlers = {
    playing: (e: Event) => playPausedHandler(e, 'playing'),
    pause: (e: Event) => playPausedHandler(e, 'pause'),
  };

  const videoEventDispatcher = async (
    name: string,
    videoData: VideoDataChangeValue,
    // eslint-disable-next-line @typescript-eslint/require-await
  ) =>
    document.dispatchEvent(
      new CustomEvent<VideoDataChanged>('videodatachange', {
        detail: { name, videoData },
      }),
    );

  const waitingEvent = new Set<string>();
  // Name = "dataloaded" and abit later "dataupdated"
  api.addEventListener('videodatachange', (name, videoData) => {
    videoEventDispatcher(name, videoData);

    if (name === 'dataupdated' && waitingEvent.has(videoData.videoId)) {
      waitingEvent.delete(videoData.videoId);
      sendSongInfo(videoData);
    } else if (name === 'dataloaded') {
      const video = $<HTMLVideoElement>('video');
      video?.dispatchEvent(srcChangedEvent);

      for (const status of ['playing', 'pause'] as const) {
        // for fix issue that pause event not fired
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
    const data = api.getPlayerResponse();

    data.videoDetails.album =
      (
        Object.entries(videoData)
          .find(([, value]) => value && Object.hasOwn(value, 'playerOverlays')) as [string, AlbumDetails | undefined]
      )?.[1]?.playerOverlays?.playerOverlayRenderer?.browserMediaSession?.browserMediaSessionRenderer?.album?.runs?.at(
        0,
      )?.text;
    data.videoDetails.elapsedSeconds = 0;
    data.videoDetails.isPaused = false;

    // HACK: This is a workaround for "podcast" type video. GREAT JOB GOOGLE.
    if (data.playabilityStatus.transportControlsConfig) {
      data.videoDetails.author =
        data.microformat.microformatDataRenderer.pageOwnerDetails.name;
    }

    window.ipcRenderer.send('ytmd:video-src-changed', data);
  }
};
