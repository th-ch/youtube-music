import { createEffect, createMemo, createSignal, For, Show } from 'solid-js';
import { syncedLyricsIPC } from '..';
import { canonicalize, simlifyUnicode } from '../utils';

interface PlainLyricsProps {
  lyrics: string;
  hasJapanese: boolean;
  hasKorean: boolean;
}

export const PlainLyrics = (props: PlainLyricsProps) => {
  const lines = props.lyrics.split('\n').filter((line) => line.trim());
  const [romanizedLines, setRomanizedLines] = createSignal<
    Record<string, string>
  >({});

  const combinedLines = createMemo(() => {
    const out = [];

    for (let i = 0; i < lines.length; i++) {
      out.push([lines[i], romanizedLines()[i]]);
    }

    return out;
  });

  createEffect(() => {
    let event = 'synced-lyrics:romanize-chinese';

    if (props.hasJapanese) {
      if (props.hasKorean) event = 'synced-lyrics:romanize-japanese-or-korean';
      else event = 'synced-lyrics:romanize-japanese';
    } else if (props.hasKorean) event = 'synced-lyrics:romanize-korean';

    (async () => {
      for (let i = 0; i < lines.length; i++) {
        const romanization = await syncedLyricsIPC()?.invoke(event, lines[i]);
        setRomanizedLines((prev) => ({
          ...prev,
          [i]: canonicalize(romanization),
        }));
      }
    })();
  });

  return (
    <div class="plain-lyrics">
      <For each={combinedLines()}>
        {([line, romanized]) => {
          return (
            <div
              class={`${
                line.match(/^\[.+\]$/s) ? 'lrc-header' : ''
              } text-lyrics description ytmusic-description-shelf-renderer`}
              style={{
                display: 'flex',
                'flex-direction': 'column',
              }}
            >
              <yt-formatted-string
                text={{
                  runs: [{ text: line }],
                }}
              />
              <Show when={simlifyUnicode(line) !== simlifyUnicode(romanized)}>
                <yt-formatted-string
                  class="romaji"
                  text={{
                    runs: [{ text: romanized }],
                  }}
                />
              </Show>
            </div>
          );
        }}
      </For>
    </div>
  );
};
