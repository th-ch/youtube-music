import { debounce, throttle } from '@/providers/decorators';
import { VideoDataChangeValue } from '@/types/player-api-events';

export const selectors = {
  head: '#tabsContent > .tab-header:nth-of-type(2)',
  body: {
    root: '[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"] ytmusic-description-shelf-renderer',
    lyrics: 'yt-formatted-string.non-expandable',
    source: 'yt-formatted-string.footer',
  },
};

export const enableTab = throttle((header: HTMLElement) => {
  header.removeAttribute('disabled');
}, 80);

export const tabStates = {
  true: debounce(({ author: _author, title: _title }: VideoDataChangeValue) => {
    // TODO: This is where we fetch lyrics.
  }, 200),
  false: debounce(() => {
    // TODO: Should we do anything here?
  }, 200),
};
