import { createEffect, createSignal, Show } from 'solid-js';

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
  line: string;
  hasJapanese: boolean;
  hasKorean: boolean;
}

export const PlainLyrics = (props: PlainLyricsProps) => {
  const [romanization, setRomanization] = createSignal('');

  createEffect(async () => {
    if (!config()?.romanization) return;

    const input = canonicalize(props.line);

    let result: string;
    if (props.hasJapanese) {
      if (props.hasKorean) result = await romanizeJapaneseOrHangul(input);
      else result = await romanizeJapanese(input);
    } else if (props.hasKorean) result = romanizeHangul(input);
    else result = romanizeChinese(input);

    setRomanization(canonicalize(result));
  });

  return (
    <div
      class={`${
        props.line.match(/^\[.+\]$/s) ? 'lrc-header' : ''
      } text-lyrics description ytmusic-description-shelf-renderer`}
      style={{
        'display': 'flex',
        'flex-direction': 'column',
      }}
    >
      <yt-formatted-string
        text={{
          runs: [{ text: props.line }],
        }}
      />
      <Show
        when={
          config()?.romanization &&
          simplifyUnicode(props.line) !== simplifyUnicode(romanization())
        }
      >
        <yt-formatted-string
          class="romaji"
          text={{
            runs: [{ text: romanization() }],
          }}
        />
      </Show>
    </div>
  );
};
