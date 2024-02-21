/* eslint-disable @typescript-eslint/no-unsafe-call */

import { createPlugin } from '@/utils';
import { RefinedLyricsConfig } from './config';
import { YoutubePlayer } from '@/types/youtube-player';
import { VideoDataChangeValue } from '@/types/player-api-events';
import { selectors, waitForElement } from './utils';

import { debounce, throttle } from '@/providers/decorators';

// Temporary hack to not mess with translations for now.
// prettier-ignore
const t = ([txt]: TemplateStringsArray) => () => txt;

type VideoDataChangedCallback = (
  type: string,
  data: VideoDataChangeValue,
) => void;

const tabStates = {
  true: debounce(({ author: _author, title: _title }: VideoDataChangeValue) => {
    // TODO: This is where we fetch lyrics.
  }, 200),
  false: debounce(() => {
    // TODO: Should we do anything here?
  }, 200),
};

export default createPlugin({
  name: t`Refined Lyrics`,
  authors: ['Arjix'],

  config: <RefinedLyricsConfig>{
    enabled: false,
  },

  renderer: {
    api: <YoutubePlayer | null>null,
    onPlayerApiReady(api) {
      api.addEventListener(
        'videodatachange',
        <VideoDataChangedCallback>this.videoDataChange,
      );
    },

    // prettier-ignore
    videoDataChange(type: string, data: VideoDataChangeValue) {
      const header = document.querySelector(selectors.head);
      if (!header) return;

      const enableTab = throttle(() => {
        if (header?.hasAttribute('disabled')) {
          header.removeAttribute('disabled');
        }
      }, 80);

      // Force the lyrics tab to be enabled at all times.
      new MutationObserver((mutations) => {
          enableTab();

          for (const mutation of mutations) {
            switch (mutation.attributeName) {
              case 'disabled':
                enableTab();
                break;
              case 'aria-selected':
                // @ts-expect-error I know what I am doing, fuck off TypeSript
                tabStates[header.ariaSelected]?.(data);
                break;
            }
          }

          // TODO: Are observers automatically destroyed if the node they are watching is also destroyed?
        },
      ).observe(header, { attributes: true });
    },
  },
});
