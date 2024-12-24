import { render } from 'solid-js/web';

import { waitForElement } from '@/utils/wait-for-element';
import { LyricsRenderer, setIsVisible } from './renderer';

export const selectors = {
  head: '#tabsContent > .tab-header:nth-of-type(2)',
  body: {
    tabRenderer: '#tab-renderer[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"]',
    root: 'ytmusic-description-shelf-renderer',
  },
};

export const tabStates: Record<string, () => void> = {
  true: async () => {
    setIsVisible(true);

    let container = document.querySelector('#synced-lyrics-container');
    if (container) return;

    const tabRenderer = await waitForElement<HTMLElement>(
      selectors.body.tabRenderer,
    );

    container = Object.assign(document.createElement('div'), {
      id: 'synced-lyrics-container',
    });

    tabRenderer.appendChild(container);
    render(() => <LyricsRenderer />, container);
  },
  false: () => {
    setIsVisible(false);
  },
};
