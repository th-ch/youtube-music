import { createSignal, onCleanup, Show } from 'solid-js';

export const [isVisible, setIsVisible] = createSignal<boolean>(false)

export const LyricsRenderer = () => {
  const [count, setCount] = createSignal(0);

  const timer = setInterval(() => setCount(count() + 1), 1000);
  onCleanup(() => clearInterval(timer));

  return (
    <Show when={isVisible()}>
      <div>
        Count: {count()}
      </div>
    </Show>
  );
}
