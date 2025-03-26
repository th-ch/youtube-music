import { createEffect, createSignal, For, Match, Show, Switch } from 'solid-js';

import { SyncedLine } from './SyncedLine';

import { ErrorDisplay } from './ErrorDisplay';
import { LoadingKaomoji } from './LoadingKaomoji';
import { PlainLyrics } from './PlainLyrics';

import { hasJapaneseInString, hasKoreanInString } from '../utils';
import { currentLyrics, lyricsStore } from '../../providers';

export const [debugInfo, setDebugInfo] = createSignal<string>();
export const [currentTime, setCurrentTime] = createSignal<number>(-1);

// prettier-ignore
export const LyricsContainer = () => {
  const [hasJapanese, setHasJapanese] = createSignal<boolean>(false);
  const [hasKorean, setHasKorean] = createSignal<boolean>(false);

  createEffect(() => {
    const data = currentLyrics()?.data;
    if (data) {
      setHasKorean(hasKoreanInString(data));
      setHasJapanese(hasJapaneseInString(data));
    } else {
      setHasKorean(false);
      setHasJapanese(false);
    }
  });

  return (
    <div class="lyric-container">
      <Switch>
        <Match when={currentLyrics()?.state === 'fetching'}>
          <LoadingKaomoji />
        </Match>
        <Match when={!currentLyrics().data?.lines && !currentLyrics().data?.lyrics}>
          <yt-formatted-string
            class="text-lyrics description ytmusic-description-shelf-renderer"
            style={{
              'display': 'inline-flex',
              'justify-content': 'center',
              'width': '100%',
              'user-select': 'none',
            }}
            text={{
              runs: [{ text: '＼(〇_ｏ)／' }],
            }}
          />
        </Match>
      </Switch>

      <Show when={lyricsStore.current.error}>
        <ErrorDisplay error={lyricsStore.current.error!} />
      </Show>

      <Switch>
        <Match when={currentLyrics().data?.lines}>
          <For each={currentLyrics().data?.lines}>
            {(item) => <SyncedLine line={item} hasJapanese={hasJapanese()} hasKorean={hasKorean()} />}
          </For>
        </Match>

        <Match when={currentLyrics().data?.lyrics}>
          <PlainLyrics lyrics={currentLyrics().data!.lyrics!} hasJapanese={hasJapanese()} hasKorean={hasKorean()} />
        </Match>
      </Switch>
    </div>
  );
};
