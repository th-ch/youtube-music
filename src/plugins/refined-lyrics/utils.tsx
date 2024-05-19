import { VideoDataChangeValue } from '@/types/player-api-events';
import { render } from 'solid-js/web';
import { LyricsRenderer, setIsVisible, setPlayerState } from '@/plugins/refined-lyrics/LyricsRenderer';

export const selectors = {
  head: '#tabsContent > .tab-header:nth-of-type(2)',
  body: {
    tabRenderer: `#tab-renderer[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"]`,
    root: 'ytmusic-description-shelf-renderer'
  },
};

export const tabStates = {
  true: (data?: VideoDataChangeValue) => {
    setIsVisible(true);
    setPlayerState(data);

    const tabRenderer = document.querySelector<HTMLElement>(selectors.body.tabRenderer);
    if (!tabRenderer) return;

    let container = document.querySelector('#refined-lyrics-container');
    if (container) return;

    container = Object.assign(
      document.createElement("div"),
      { id: "refined-lyrics-container" }
    );

    tabRenderer.appendChild(container);
    render(() => (<LyricsRenderer />), container);
  },
  false: () => {
    setIsVisible(false);
  },
};
