import { Segment } from './types';
import builder from './index';

export default builder.createRenderer(({ on }) => {
  let currentSegments: Segment[] = [];

  const timeUpdateListener = (e: Event) => {
    if (e.target instanceof HTMLVideoElement) {
      const target = e.target;

      for (const segment of currentSegments) {
        if (
          target.currentTime >= segment[0]
          && target.currentTime < segment[1]
        ) {
          target.currentTime = segment[1];
          if (window.electronIs.dev()) {
            console.log('SponsorBlock: skipping segment', segment);
          }
        }
      }
    }
  };

  const resetSegments = () => currentSegments = [];

  return ({
    onLoad() {
      on('sponsorblock-skip', (_, segments: Segment[]) => {
        currentSegments = segments;
      });
    },
    onPlayerApiReady() {
      const video = document.querySelector<HTMLVideoElement>('video');
      if (!video) return;

      video.addEventListener('timeupdate', timeUpdateListener);
      // Reset segments on song end
      video.addEventListener('emptied', resetSegments);
    },
    onUnload() {
      const video = document.querySelector<HTMLVideoElement>('video');
      if (!video) return;

      video.removeEventListener('timeupdate', timeUpdateListener);
      video.removeEventListener('emptied', resetSegments);
    }
  });
});
