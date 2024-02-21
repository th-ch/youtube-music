/* eslint-disable @typescript-eslint/no-unsafe-call */

import { createPlugin } from '@/utils';
import { RefinedLyricsConfig } from './config';
import { YoutubePlayer } from '@/types/youtube-player';
import { VideoDataChangeValue } from '@/types/player-api-events';
import { enableTab, selectors, tabStates } from './utils';

// Temporary hack to not mess with translations for now.
// prettier-ignore
const t = ([txt]: TemplateStringsArray) => () => txt;

type VideoDataChangedCallback = (
  type: string,
  data: VideoDataChangeValue,
) => void;

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
    videoDataChange(_type: string, data: VideoDataChangeValue) {
      const header = document.querySelector<HTMLElement>(selectors.head);
      if (!header) return;

      // Force the lyrics tab to be enabled at all times.
      new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            switch (mutation.attributeName) {
              case 'disabled':
                enableTab(header);
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
