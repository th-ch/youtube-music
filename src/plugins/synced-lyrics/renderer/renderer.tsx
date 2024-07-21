/* eslint-disable import/order */

import { createSignal, Show } from 'solid-js';
import { VideoDetails } from '@/types/video-details';
import { SyncedLyricsPluginConfig } from '../types';
import { LyricsContainer } from './components/LyricsContainer';

export const [isVisible, setIsVisible] = createSignal<boolean>(false);

// prettier-ignore
export const [config, setConfig] = createSignal<SyncedLyricsPluginConfig | null>(null);
// prettier-ignore
export const [playerState, setPlayerState] = createSignal<VideoDetails | null>(null);

export const LyricsRenderer = () => {
  return (
    <Show when={isVisible()}>
      <LyricsContainer />
    </Show>
  );
};
