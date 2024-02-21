export const waitForElement = <RT extends HTMLElement>(
  selector: string,
): Promise<RT> => {
  return new Promise((resolve, reject) => {
    const cb = () => {
      const node = document.querySelector<RT>(selector);
      if (node) {
        resolve(node);
      } else setTimeout(cb, 50);
    };
    cb();
  });
};

export const selectors = {
  head: '#tabsContent > .tab-header:nth-of-type(2)',
  body: {
    root: '[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"] ytmusic-description-shelf-renderer',
    lyrics: 'yt-formatted-string.non-expandable',
    source: 'yt-formatted-string.footer',
  },
};
