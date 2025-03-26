import { createEffect, createMemo, createSignal, For, Show } from 'solid-js';

import {
  canonicalize,
  romanizeChinese,
  romanizeHangul,
  romanizeJapanese,
  romanizeJapaneseOrHangul,
  simplifyUnicode,
} from '../utils';
import { config } from '../renderer';

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

  createEffect(async () => {
    if (!config()?.romanization) return;

    for (let i = 0; i < lines.length; i++) {
      let romanized: string;

      if (props.hasJapanese) {
        if (props.hasKorean)
          romanized = await romanizeJapaneseOrHangul(lines[i]);
        else romanized = await romanizeJapanese(lines[i]);
      } else if (props.hasKorean) romanized = romanizeHangul(lines[i]);
      else romanized = romanizeChinese(lines[i]);

      setRomanizedLines((prev) => ({
        ...prev,
        [i]: canonicalize(romanized),
      }));
    }
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
                'display': 'flex',
                'flex-direction': 'column',
              }}
            >
              <yt-formatted-string
                text={{
                  runs: [{ text: line }],
                }}
              />
              <Show
                when={
                  config()?.romanization &&
                  simplifyUnicode(line) !== simplifyUnicode(romanized)
                }
              >
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
