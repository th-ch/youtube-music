import { createSignal, Show } from 'solid-js';

import { LyricsContainer } from './components/LyricsContainer';

import type { VideoDetails } from '@/types/video-details';
import type { SyncedLyricsPluginConfig } from '../types';

export const [isVisible, setIsVisible] = createSignal<boolean>(false);

export const [config, setConfig] =
  createSignal<SyncedLyricsPluginConfig | null>(null);
export const [playerState, setPlayerState] = createSignal<VideoDetails | null>(
  null,
);

export const LyricsRenderer = () => {
  return (
    <Show when={isVisible()}>
      <LyricsContainer />
    </Show>
  );
};
