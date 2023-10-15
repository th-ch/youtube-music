import sliderHTML from './templates/slider.html';

import { getSongMenu } from '../../providers/dom-elements';
import { ElementFromHtml } from '../utils';
import { singleton } from '../../providers/decorators';


function $<E extends Element = Element>(selector: string) {
  return document.querySelector<E>(selector);
}

const slider = ElementFromHtml(sliderHTML);

const roundToTwo = (n: number) => Math.round(n * 1e2) / 1e2;

const MIN_PLAYBACK_SPEED = 0.07;
const MAX_PLAYBACK_SPEED = 16;

let playbackSpeed = 1;

const updatePlayBackSpeed = () => {
  const videoElement = $<HTMLVideoElement>('video');
  if (videoElement) {
    videoElement.playbackRate = playbackSpeed;
  }

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
  const video = $<HTMLVideoElement>('video');
  if (video) {
    video.addEventListener('ratechange', forcePlaybackRate);
    video.addEventListener('srcChanged', forcePlaybackRate);
  }
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
    const playbackSpeedSilder = $<HTMLElement & { value: number }>('#playback-speed-slider');
    if (playbackSpeedSilder) {
      playbackSpeedSilder.value = playbackSpeed;
    }
  });
};

function forcePlaybackRate(e: Event) {
  if (e.target instanceof HTMLVideoElement) {
    const videoElement = e.target;
    if (videoElement.playbackRate !== playbackSpeed) {
      videoElement.playbackRate = playbackSpeed;
    }
  }
}

export default () => {
  document.addEventListener('apiLoaded', () => {
    observePopupContainer();
    observeVideo();
    setupWheelListener();
  }, { once: true, passive: true });
};
