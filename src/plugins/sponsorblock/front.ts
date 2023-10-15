import { ipcRenderer } from 'electron';
import is from 'electron-is';

import { Segment } from './types';

let currentSegments: Segment[] = [];

export default () => {
  ipcRenderer.on('sponsorblock-skip', (_, segments: Segment[]) => {
    currentSegments = segments;
  });

  document.addEventListener('apiLoaded', () => {
    const video = document.querySelector<HTMLVideoElement>('video');
    if (!video) return;

    video.addEventListener('timeupdate', (e) => {
      if (e.target instanceof HTMLVideoElement) {
        const target = e.target;

        for (const segment of currentSegments) {
          if (
            target.currentTime >= segment[0]
            && target.currentTime < segment[1]
          ) {
            target.currentTime = segment[1];
            if (is.dev()) {
              console.log('SponsorBlock: skipping segment', segment);
            }
          }
        }
      }
    });
    // Reset segments on song end
    video.addEventListener('emptied', () => currentSegments = []);
  }, { once: true, passive: true });
};
