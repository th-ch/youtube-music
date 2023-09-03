import { getSongMenu } from '../../providers/dom-elements';
import { ElementFromFile, templatePath } from '../utils';
import { singleton } from '../../providers/decorators';


function $(selector: string) {
  return document.querySelector(selector);
}

const slider = ElementFromFile(templatePath(__dirname, 'slider.html'));

const roundToTwo = (n: number) => Math.round(n * 1e2) / 1e2;

const MIN_PLAYBACK_SPEED = 0.07;
const MAX_PLAYBACK_SPEED = 16;

let playbackSpeed = 1;

const updatePlayBackSpeed = () => {
  ($('video') as HTMLVideoElement).playbackRate = playbackSpeed;

  const playbackSpeedElement = $('#playback-speed-value');
  if (playbackSpeedElement) {
    playbackSpeedElement.innerHTML = String(playbackSpeed);
  }
};

let menu: Element | null = null;

const setupSliderListener = singleton(() => {
  $('#playback-speed-slider')?.addEventListener('immediate-value-changed', (e) => {
    playbackSpeed = (e as CustomEvent<{ value: number; }>).detail.value || MIN_PLAYBACK_SPEED;
    if (isNaN(playbackSpeed)) {
      playbackSpeed = 1;
    }

    updatePlayBackSpeed();
  });
});

const observePopupContainer = () => {
  const observer = new MutationObserver(() => {
    if (!menu) {
      menu = getSongMenu();
    }

    if (
      menu &&
      (menu.parentElement as HTMLElement & { eventSink_: Element | null })
        ?.eventSink_
        ?.matches('ytmusic-menu-renderer.ytmusic-player-bar')&& !menu.contains(slider)
    ) {
      menu.prepend(slider);
      setupSliderListener();
    }
  });

  const popupContainer = $('ytmusic-popup-container');
  if (popupContainer) {
    observer.observe(popupContainer, {
      childList: true,
      subtree: true,
    });
  }
};

const observeVideo = () => {
  const video = $('video') as HTMLVideoElement;
  video.addEventListener('ratechange', forcePlaybackRate);
  video.addEventListener('srcChanged', forcePlaybackRate);
};

const setupWheelListener = () => {
  slider.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isNaN(playbackSpeed)) {
      playbackSpeed = 1;
    }

    // E.deltaY < 0 means wheel-up
    playbackSpeed = roundToTwo(e.deltaY < 0
      ? Math.min(playbackSpeed + 0.01, MAX_PLAYBACK_SPEED)
      : Math.max(playbackSpeed - 0.01, MIN_PLAYBACK_SPEED),
    );

    updatePlayBackSpeed();
    // Update slider position
    ($('#playback-speed-slider') as HTMLElement & { value: number }).value = playbackSpeed;
  });
};

function forcePlaybackRate(e: Event) {
  const videoElement = (e.target as HTMLVideoElement);
  if (videoElement.playbackRate !== playbackSpeed) {
    videoElement.playbackRate = playbackSpeed;
  }
}

export default () => {
  document.addEventListener('apiLoaded', () => {
    observePopupContainer();
    observeVideo();
    setupWheelListener();
  }, { once: true, passive: true });
};
