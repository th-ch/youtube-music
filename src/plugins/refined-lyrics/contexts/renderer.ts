/* eslint-disable @typescript-eslint/no-unsafe-call */

import { createRenderer } from '@/utils';
import { YoutubePlayer } from '@/types/youtube-player';
import { selectors, tabStates } from '@/plugins/refined-lyrics/utils';
import { VideoDataChangeValue } from '@/types/player-api-events';

type VideoDataChangedCallback = (
  type: string,
  data: VideoDataChangeValue,
) => void;

export default createRenderer({
  api: <YoutubePlayer | null>null,
  observer: <MutationObserver | null>null,
  observerCallback(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      const header = <HTMLElement>mutation.target;

      switch (mutation.attributeName) {
        case 'disabled':
          header.removeAttribute('disabled')
          break;
        case 'aria-selected':
          // @ts-expect-error I know what I am doing, fuck off TypeSript
          tabStates[header.ariaSelected]?.(this.api.getVideoData());
          break;
      }
    }
  },

  onPlayerApiReady(api) {
    this.api = api;

    api.addEventListener(
      'videodatachange',
      <VideoDataChangedCallback>this.videoDataChange,
    );

    // @ts-ignore
    this.videoDataChange();
  },

  start() {},
  stop() {
    this.observer?.disconnect();
    this.api?.removeEventListener(
      'videodatachange',
      <VideoDataChangedCallback>this.videoDataChange,
    );
  },

  // prettier-ignore
  videoDataChange() {
    const header = document.querySelector<HTMLElement>(selectors.head);
    if (!header) return;

    this.observer ??= new MutationObserver(<MutationCallback>this.observerCallback);

    // Force the lyrics tab to be enabled at all times.
    this.observer.disconnect();
    this.observer.observe(header, { attributes: true });
    header.removeAttribute('disabled');

    // @ts-ignore
    tabStates['true'](this.api.getVideoData())
  },
})
