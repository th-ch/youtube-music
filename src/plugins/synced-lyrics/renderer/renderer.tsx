/* eslint-disable import/order */

import { createSignal, onCleanup, Show } from 'solid-js';
import { VideoDetails } from '@/types/video-details';
import { SyncedLyricsPluginConfig } from '../types';
import { LyricsContainer } from './components/LyricsContainer';

export const [isVisible, setIsVisible] = createSignal<boolean>(false);

// prettier-ignore
export const [config, setConfig] = createSignal<SyncedLyricsPluginConfig | null>(null);
// prettier-ignore
export const [playerState, setPlayerState] = createSignal<VideoDetails | null>(null);

export const LyricsRenderer = () => {
  const [count, setCount] = createSignal(0);

  const timer = setInterval(() => setCount(count() + 1), 1000);
  onCleanup(() => clearInterval(timer));

  return (
    <Show when={isVisible()}>
      <LyricsContainer />
    </Show>
  );
};
