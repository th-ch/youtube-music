import sliderHTML from './templates/slider.html?raw';

import { getSongMenu } from '@/providers/dom-elements';
import { singleton } from '@/providers/decorators';

import { defaultTrustedTypePolicy } from '@/utils/trusted-types';

import { ElementFromHtml } from '../utils/renderer';

const slider = ElementFromHtml(sliderHTML);

const roundToTwo = (n: number) => Math.round(n * 1e2) / 1e2;

const MIN_PLAYBACK_SPEED = 0.07;
const MAX_PLAYBACK_SPEED = 16;

let playbackSpeed = 1;

const updatePlayBackSpeed = () => {
  const videoElement = document.querySelector<HTMLVideoElement>('video');
  if (videoElement) {
    videoElement.playbackRate = playbackSpeed;
  }

  const playbackSpeedElement = document.querySelector('#playback-speed-value');
  if (playbackSpeedElement) {
    const targetHtml = String(playbackSpeed);
    (playbackSpeedElement.innerHTML as string | TrustedHTML) =
      defaultTrustedTypePolicy
        ? defaultTrustedTypePolicy.createHTML(targetHtml)
        : targetHtml;
  }
};

let menu: Element | null = null;

const immediateValueChangedListener = (e: Event) => {
  playbackSpeed =
    (e as CustomEvent<{ value: number }>).detail.value || MIN_PLAYBACK_SPEED;
  if (isNaN(playbackSpeed)) {
    playbackSpeed = 1;
  }

  updatePlayBackSpeed();
};

const setupSliderListener = singleton(() => {
  document
    .querySelector('#playback-speed-slider')
    ?.addEventListener(
      'immediate-value-changed',
      immediateValueChangedListener,
    );
});

const observePopupContainer = () => {
  const observer = new MutationObserver(() => {
    if (!menu) {
      menu = getSongMenu();
    }

    if (menu && !menu.contains(slider)) {
      menu.prepend(slider);
      setupSliderListener();
    }
  });

  const popupContainer = document.querySelector('ytmusic-popup-container');
  if (popupContainer) {
    observer.observe(popupContainer, {
      childList: true,
      subtree: true,
    });
  }
};

const observeVideo = () => {
  const video = document.querySelector<HTMLVideoElement>('video');
  if (video) {
    video.addEventListener('ratechange', forcePlaybackRate);
    video.addEventListener('ytmd:src-changed', forcePlaybackRate);
  }
};

const wheelEventListener = (e: WheelEvent) => {
  e.preventDefault();
  if (isNaN(playbackSpeed)) {
    playbackSpeed = 1;
  }

  // E.deltaY < 0 means wheel-up
  playbackSpeed = roundToTwo(
    e.deltaY < 0
      ? Math.min(playbackSpeed + 0.01, MAX_PLAYBACK_SPEED)
      : Math.max(playbackSpeed - 0.01, MIN_PLAYBACK_SPEED),
  );

  updatePlayBackSpeed();
  // Update slider position
  const playbackSpeedSilder = document.querySelector<
    HTMLElement & { value: number }
  >('#playback-speed-slider');
  if (playbackSpeedSilder) {
    playbackSpeedSilder.value = playbackSpeed;
  }
};

const setupWheelListener = () => {
  slider.addEventListener('wheel', wheelEventListener);
};

function forcePlaybackRate(e: Event) {
  if (e.target instanceof HTMLVideoElement) {
    const videoElement = e.target;
    if (videoElement.playbackRate !== playbackSpeed) {
      videoElement.playbackRate = playbackSpeed;
    }
  }
}

export const onPlayerApiReady = () => {
  observePopupContainer();
  observeVideo();
  setupWheelListener();
};

export const onUnload = () => {
  const video = document.querySelector<HTMLVideoElement>('video');
  if (video) {
    video.removeEventListener('ratechange', forcePlaybackRate);
    video.removeEventListener('ytmd:src-changed', forcePlaybackRate);
  }
  slider.removeEventListener('wheel', wheelEventListener);
  getSongMenu()?.removeChild(slider);
  document
    .querySelector('#playback-speed-slider')
    ?.removeEventListener(
      'immediate-value-changed',
      immediateValueChangedListener,
    );
};
