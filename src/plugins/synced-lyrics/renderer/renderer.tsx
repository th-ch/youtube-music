/* eslint-disable import/order */

import { createEffect, createSignal, onMount, Show } from 'solid-js';

import { LyricsContainer } from './components/LyricsContainer';
import { LyricsPicker } from './components/LyricsPicker';

import type { SyncedLyricsPluginConfig } from '../types';
import { selectors } from './utils';
import { throttle } from '@/providers/decorators';

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
        'var(--ytmusic-text-primary)'
      );
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1.2');
      root.style.setProperty('--offset-lyrics', '0');
      root.style.setProperty('--lyric-width', '83%');
      break;
    case 'offset':
      root.style.setProperty(
        '--previous-lyrics',
        'var(--ytmusic-text-primary)'
      );
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1');
      root.style.setProperty('--offset-lyrics', '5%');
      root.style.setProperty('--lyric-width', '100%');
      break;
    case 'focus':
      root.style.setProperty(
        '--previous-lyrics',
        'var(--ytmusic-text-secondary)'
      );
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1');
      root.style.setProperty('--offset-lyrics', '0');
      root.style.setProperty('--lyric-width', '100%');
      break;
  }
});

const [count, setCount] = createSignal(0);

export const renderCount = count;
export const triggerRender = () => setCount((i) => i + 1);

export const LyricsRenderer = () => {
  const [stickyRef, setStickRef] = createSignal<HTMLElement | null>(null);

  onMount(() => {
    const tabRenderer = document.querySelector<HTMLElement>(
      selectors.body.tabRenderer
    )!;

    let lastY = tabRenderer.scrollTop;
    const scrollListener = throttle(() => {
      const newY = tabRenderer.scrollTop;
      const isScrollingDown = newY > lastY;

      if (!stickyRef()) return;
      if (isScrollingDown) {
        stickyRef()!.style.setProperty('--top', '-100%');
      } else {
        stickyRef()!.style.setProperty('--top', '0');
      }

      // update last scroll position
      lastY = tabRenderer.scrollTop;
    }, 50);

    tabRenderer.addEventListener('scroll', scrollListener);
    return () => tabRenderer.removeEventListener('scroll', scrollListener);
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
      <span style={{ display: 'none' }}>{renderCount()}</span>
    </Show>
  );
};
