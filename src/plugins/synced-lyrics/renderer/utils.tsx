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
      selectors.body.tabRenderer
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

export const canonicalize = (text: string) => {
  // `hi  there` => `hi there`
  text = text.replaceAll(/\s+/g, ' ');

  // `( a )` => `(a)`
  text = text.replaceAll(/([\(\[]) ([^ ])/g, (_, symbol, a) => `${symbol}${a}`);
  text = text.replaceAll(/([^ ]) ([\)\]])/g, (_, a, symbol) => `${a}${symbol}`);

  // `can ' t` => `can't`
  text = text.replaceAll(
    /(?:([Ii]) (') ([^ ]))|(?:(n) (') (t)(?= |$))|(?:(t) (') (s))|(?:([^ ]) (') (re))|(?:([^ ]) (') (ve))|(?:([^ ]) (-) ([^ ]))/g,
    (m, ...groups) => {
      for (let i = 0; i < groups.length; i += 3) {
        if (groups[i]) {
          return groups.slice(i, i + 3).join('');
        }
      }

      return m;
    }
  );

  // `Stayin ' still` => `Stayin' still`
  text = text.replaceAll(/in ' ([^ ])/g, (_, char) => `in' ${char}`);
  text = text.replaceAll("in ',", "in',");

  text = text.replaceAll(", ' cause", ", 'cause");

  // `hi , there` => `hi, there`
  text = text.replaceAll(
    /([^ ]) ([\.,!?])/g,
    (_, a, symbol) => `${a}${symbol}`
  );

  // `hi " there "` => `hi "there"`
  text = text.replaceAll(/"([^"]+)"/g, (_, content) => `"${content.trim()}"`);

  return text.trim();
};

export const simlifyUnicode = (text?: string) =>
  text
    ? text
        .replaceAll(/\u0020|\u00A0|[\u2000-\u200A]|\u202F|\u205F|\u3000/g, ' ')
        .trim()
    : text;
