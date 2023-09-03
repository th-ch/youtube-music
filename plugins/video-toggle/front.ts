import { ElementFromFile, templatePath } from '../utils';
import { setOptions, isEnabled } from '../../config/plugins';

import { moveVolumeHud as preciseVolumeMoveVolumeHud } from '../precise-volume/front';

import { YoutubePlayer } from '../../types/youtube-player';
import { ThumbnailElement } from '../../types/get-player-response';

import type { ConfigType } from '../../config/dynamic';

const moveVolumeHud = isEnabled('precise-volume') ? preciseVolumeMoveVolumeHud : () => {};

function $(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

let options: ConfigType<'video-toggle'>;
let player: HTMLElement & { videoMode_: boolean };
let video: HTMLVideoElement;
let api: YoutubePlayer;

const switchButtonDiv = ElementFromFile(
  templatePath(__dirname, 'button_template.html'),
);

export default (_options: ConfigType<'video-toggle'>) => {
  if (_options.forceHide) {
    return;
  }

  switch (_options.mode) {
    case 'native': {
      $('ytmusic-player-page')?.setAttribute('has-av-switcher', '');
      $('ytmusic-player')?.setAttribute('has-av-switcher', '');
      return;
    }

    case 'disabled': {
      $('ytmusic-player-page')?.removeAttribute('has-av-switcher');
      $('ytmusic-player')?.removeAttribute('has-av-switcher');
      return;
    }

    default:
    case 'custom': {
      options = _options;
      document.addEventListener('apiLoaded', setup, { once: true, passive: true });
    }
  }
};

function setup(e: CustomEvent<YoutubePlayer>) {
  api = e.detail;
  player = $('ytmusic-player') as typeof player;
  video = $('video') as HTMLVideoElement;

  ($('#player') as HTMLVideoElement).prepend(switchButtonDiv);

  if (options.hideVideo) {
    ($('.video-switch-button-checkbox') as HTMLInputElement).checked = false;
    changeDisplay(false);
    forcePlaybackMode();
    // Fix black video
    video.style.height = 'auto';
  }

  //Prevents bubbling to the player which causes it to stop or resume
  switchButtonDiv.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Button checked = show video
  switchButtonDiv.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    options.hideVideo = target.checked;
    changeDisplay(target.checked);
    setOptions('video-toggle', options);
  });

  video.addEventListener('srcChanged', videoStarted);

  observeThumbnail();

  switch (options.align) {
    case 'right': {
      switchButtonDiv.style.left = 'calc(100% - 240px)';
      return;
    }

    case 'middle': {
      switchButtonDiv.style.left = 'calc(50% - 120px)';
      return;
    }

    default:
    case 'left': {
      switchButtonDiv.style.left = '0px';
    }
  }
}

function changeDisplay(showVideo: boolean) {
  player.style.margin = showVideo ? '' : 'auto 0px';
  player.setAttribute('playback-mode', showVideo ? 'OMV_PREFERRED' : 'ATV_PREFERRED');

  $('#song-video.ytmusic-player')!.style.display = showVideo ? 'block' : 'none';
  $('#song-image')!.style.display = showVideo ? 'none' : 'block';

  if (showVideo && !video.style.top) {
    video.style.top = `${(player.clientHeight - video.clientHeight) / 2}px`;
  }

  moveVolumeHud(showVideo);
}

function videoStarted() {
  if (api.getPlayerResponse().videoDetails.musicVideoType === 'MUSIC_VIDEO_TYPE_ATV') {
    // Video doesn't exist -> switch to song mode
    changeDisplay(false);
    // Hide toggle button
    switchButtonDiv.style.display = 'none';
  } else {
    // Switch to high-res thumbnail
    forceThumbnail($('#song-image img') as HTMLImageElement);
    // Show toggle button
    switchButtonDiv.style.display = 'initial';
    // Change display to video mode if video exist & video is hidden & option.hideVideo = false
    if (!options.hideVideo && $('#song-video.ytmusic-player')?.style.display === 'none') {
      changeDisplay(true);
    } else {
      moveVolumeHud(!options.hideVideo);
    }
  }
}

// On load, after a delay, the page overrides the playback-mode to 'OMV_PREFERRED' which causes weird aspect ratio in the image container
// this function fix the problem by overriding that override :)
function forcePlaybackMode() {
  const playbackModeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target as HTMLElement;
      if (target.getAttribute('playback-mode') !== 'ATV_PREFERRED') {
        playbackModeObserver.disconnect();
        target.setAttribute('playback-mode', 'ATV_PREFERRED');
      }
    }
  });
  playbackModeObserver.observe(player, { attributeFilter: ['playback-mode'] });
}

function observeThumbnail() {
  const playbackModeObserver = new MutationObserver((mutations) => {
    if (!player.videoMode_) {
      return;
    }

    for (const mutation of mutations) {
      const target = mutation.target as HTMLImageElement;
      if (!target.src.startsWith('data:')) {
        continue;
      }

      forceThumbnail(target);
    }
  });
  playbackModeObserver.observe($('#song-image img')!, { attributeFilter: ['src'] });
}

function forceThumbnail(img: HTMLImageElement) {
  const thumbnails: ThumbnailElement[] = ($('#movie_player') as unknown as YoutubePlayer).getPlayerResponse()?.videoDetails?.thumbnail?.thumbnails ?? [];
  if (thumbnails && thumbnails.length > 0) {
    const thumbnail = thumbnails.at(-1)?.url.split('?')[0];
    if (typeof thumbnail === 'string') img.src = thumbnail;
  }
}
