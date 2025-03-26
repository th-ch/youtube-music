import { createEffect, createMemo, For, Show, createSignal } from 'solid-js';

import { currentTime } from './LyricsContainer';

import { config } from '../renderer';
import { _ytAPI } from '..';

import {
  canonicalize,
  romanizeChinese,
  romanizeHangul,
  romanizeJapanese,
  romanizeJapaneseOrHangul,
  simplifyUnicode,
} from '../utils';

import type { LineLyrics } from '../../types';

interface SyncedLineProps {
  line: LineLyrics;
  hasJapanese: boolean;
  hasKorean: boolean;
}

export const SyncedLine = (props: SyncedLineProps) => {
  const status = createMemo(() => {
    const current = currentTime();

    if (props.line.timeInMs >= current) return 'upcoming';
    if (current - props.line.timeInMs >= props.line.duration) return 'previous';
    return 'current';
  });

  let ref: HTMLDivElement | undefined;
  createEffect(() => {
    if (status() === 'current') {
      ref?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  const text = createMemo(() => {
    if (!props.line.text.trim()) {
      return config()?.defaultTextString ?? '';
    }

    return props.line.text;
  });

  const [romanization, setRomanization] = createSignal('');

  createEffect(async () => {
    if (!config()?.romanization) return;

    const input = canonicalize(text());

    let result: string;
    if (props.hasJapanese) {
      if (props.hasKorean) result = await romanizeJapaneseOrHangul(input);
      else result = await romanizeJapanese(input);
    } else if (props.hasKorean) result = romanizeHangul(input);
    else result = romanizeChinese(input);

    setRomanization(canonicalize(result));
  });

  if (!text()) {
    return (
      <yt-formatted-string
        text={{
          runs: [{ text: '' }],
        }}
      />
    );
  }

  return (
    <div
      ref={ref}
      class={`synced-line ${status()}`}
      onClick={() => {
        _ytAPI?.seekTo(props.line.timeInMs / 1000);
      }}
    >
      <div dir="auto" class="description ytmusic-description-shelf-renderer">
        <yt-formatted-string
          text={{
            runs: [
              { text: config()?.showTimeCodes ? `[${props.line.time}] ` : '' },
            ],
          }}
        />

        <div
          class="text-lyrics"
          ref={(div: HTMLDivElement) => {
            // TODO: Investigate the animation, even though the duration is properly set, all lines have the same animation duration
            div.style.setProperty(
              '--lyrics-duration',
              `${props.line.duration / 1000}s`,
              'important',
            );
          }}
          style={{ 'display': 'flex', 'flex-direction': 'column' }}
        >
          <span>
            <For each={text().split(' ')}>
              {(word, index) => {
                return (
                  <span
                    style={{
                      'transition-delay': `${index() * 0.05}s`,
                      'animation-delay': `${index() * 0.05}s`,
                    }}
                  >
                    <yt-formatted-string
                      text={{
                        runs: [{ text: `${word} ` }],
                      }}
                    />
                  </span>
                );
              }}
            </For>
          </span>

          <Show
            when={
              config()?.romanization &&
              simplifyUnicode(text()) !== simplifyUnicode(romanization())
            }
          >
            <span class="romaji">
              <For each={romanization().split(' ')}>
                {(word, index) => {
                  return (
                    <span
                      style={{
                        'transition-delay': `${index() * 0.05}s`,
                        'animation-delay': `${index() * 0.05}s`,
                      }}
                    >
                      <yt-formatted-string
                        text={{
                          runs: [{ text: `${word} ` }],
                        }}
                      />
                    </span>
                  );
                }}
              </For>
            </span>
          </Show>
        </div>
      </div>
    </div>
  );
};
