import { LineLyrics, LineLyricsStatus } from '../../types';
import { config } from '../renderer';

export const initLyricsStyle = () => {
  const root = document.documentElement;

  // Set the line effect
  switch (config()?.lineEffect) {
    case 'scale':
      root.style.setProperty(
        '--previous-lyrics',
        'var(--ytmusic-text-primary)',
      );
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1.2em');
      root.style.setProperty('--offset-lyrics', '0');
      break;
    case 'offset':
      root.style.setProperty(
        '--previous-lyrics',
        'var(--ytmusic-text-primary)',
      );
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1em');
      root.style.setProperty('--offset-lyrics', '1em');
      break;
    case 'focus':
      root.style.setProperty(
        '--previous-lyrics',
        'var(--ytmusic-text-secondary)',
      );
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1em');
      root.style.setProperty('--offset-lyrics', '0');
      break;
  }
};

export const styleLyrics = (actualLyric: LineLyrics) => {
  const lyrics = document.querySelectorAll('.synced-line');

  const setStatus = (lyric: Element, status: LineLyricsStatus) => {
    lyric.classList.remove('current');
    lyric.classList.remove('previous');
    lyric.classList.remove('upcoming');
    lyric.classList.add(status);
  };

  lyrics.forEach((lyric: Element) => {
    const index = parseInt(lyric.getAttribute('data-index')!);
    if (index === actualLyric.index) setStatus(lyric, 'current');
    else if (index < actualLyric.index) setStatus(lyric, 'previous');
    else setStatus(lyric, 'upcoming');
  });

  const targetElement = document.querySelector<HTMLElement>('.current');
  if (targetElement)
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
