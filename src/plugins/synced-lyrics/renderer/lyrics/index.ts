import { createEffect } from 'solid-js';

import { config } from '../renderer';

export { makeLyricsRequest } from './fetch';

createEffect(() => {
  if (!config()?.enabled) return;
  const root = document.documentElement;

  // Set the line effect
  switch (config()?.lineEffect) {
    case 'scale':
      root.style.setProperty(
        '--previous-lyrics',
        'var(--ytmusic-text-primary)',
      );
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1.2');
      root.style.setProperty('--offset-lyrics', '0');
      root.style.setProperty('--lyric-width', '83%');
      break;
    case 'offset':
      root.style.setProperty(
        '--previous-lyrics',
        'var(--ytmusic-text-primary)',
      );
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1');
      root.style.setProperty('--offset-lyrics', '5%');
      root.style.setProperty('--lyric-width', '100%');
      break;
    case 'focus':
      root.style.setProperty(
        '--previous-lyrics',
        'var(--ytmusic-text-secondary)',
      );
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1');
      root.style.setProperty('--offset-lyrics', '0');
      root.style.setProperty('--lyric-width', '100%');
      break;
  }
});
