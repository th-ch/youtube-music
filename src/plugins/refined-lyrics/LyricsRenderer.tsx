import { createSignal, onCleanup, Show } from 'solid-js';
import { VideoDataChangeValue } from '@/types/player-api-events';

export const [isVisible, setIsVisible] = createSignal<boolean>(false);
export const [playerState, setPlayerState] = createSignal<VideoDataChangeValue | undefined>();

export const LyricsRenderer = () => {
  const [count, setCount] = createSignal(0);

  const timer = setInterval(() => setCount(count() + 1), 1000);
  onCleanup(() => clearInterval(timer));

  return (
    <Show when={isVisible()}>
      <div>
        <p>Author: {playerState()?.author}</p>
        <p>Title: {playerState()?.title}</p>
      </div>
    </Show>
  );
}
