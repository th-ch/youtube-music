import { createSignal, For, Match, Show, Switch } from 'solid-js';
import { SyncedLine } from './SyncedLine';

import { currentLyrics, lyricsStore } from '../../providers';
import { ErrorDisplay } from './ErrorDisplay';
import { LoadingKaomoji } from './LoadingKaomoji';

export const [debugInfo, setDebugInfo] = createSignal<string>();
export const [currentTime, setCurrentTime] = createSignal<number>(-1);

export const LyricsContainer = () => {
  return (
    <div class="lyric-container">
      <Switch>
        <Match when={currentLyrics()?.state === 'fetching'}>
          <LoadingKaomoji />
        </Match>
        <Match when={!currentLyrics().data?.lines}>
          <yt-formatted-string
            class="text-lyrics description ytmusic-description-shelf-renderer"
            style={{
              display: 'inline-flex',
              'justify-content': 'center',
              width: '100%',
              'user-select': 'none',
            }}
            text={{
              runs: [{ text: '	＼(〇_ｏ)／' }],
            }}
          />
        </Match>
      </Switch>

      <Show when={lyricsStore.current.error}>
        <ErrorDisplay error={lyricsStore.current.error!} />
      </Show>

      <For each={currentLyrics().data?.lines}>
        {(item) => <SyncedLine line={item} />}
      </For>
    </div>
  );
};
