import { createEffect, createSignal, onMount, Show } from 'solid-js';

import { LyricsContainer } from './components/LyricsContainer';
import { LyricsPicker } from './components/LyricsPicker';

import { selectors } from './utils';

import type { SyncedLyricsPluginConfig } from '../types';

export const [isVisible, setIsVisible] = createSignal<boolean>(false);
export const [config, setConfig] =
  createSignal<SyncedLyricsPluginConfig | null>(null);

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

export const LyricsRenderer = () => {
  const [stickyRef, setStickRef] = createSignal<HTMLElement | null>(null);

  // prettier-ignore
  onMount(() => {
    const tab = document.querySelector<HTMLElement>(selectors.body.tabRenderer)!;

    const mousemoveListener = (e: MouseEvent) => {
      const { top } = tab.getBoundingClientRect();
      const { clientHeight: height } = stickyRef()!;

      const showPicker = (e.clientY - top - 5) <= height;
      if (showPicker) {
        // picker visible
        stickyRef()!.style.setProperty('--top', '0');
      } else {
        // picker hidden
        stickyRef()!.style.setProperty('--top', '-50%');
      }
    };

    tab.addEventListener('mousemove', mousemoveListener);
    return () => tab.removeEventListener('mousemove', mousemoveListener);
  });

  return (
    <Show when={isVisible()}>
      <div class="lyrics-renderer">
        <div class="lyrics-renderer-sticky" ref={setStickRef}>
          <LyricsPicker />
          <div
            id="divider"
            class="style-scope ytmusic-guide-section-renderer"
            style={{ width: '100%', margin: '0' }}
          ></div>
        </div>
        <LyricsContainer />
      </div>
    </Show>
  );
};
