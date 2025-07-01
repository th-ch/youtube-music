import { createEffect, createMemo, For, Show, createSignal } from 'solid-js';

import { config } from '../renderer';
import { _ytAPI } from '..';

import { canonicalize, romanize, simplifyUnicode } from '../utils';

import { VirtualizerHandle } from 'virtua/solid';
import { LineLyrics } from '@/plugins/synced-lyrics/types';

interface SyncedLineProps {
  scroller: VirtualizerHandle;
  index: number;

  line: LineLyrics;
  status: 'upcoming' | 'current' | 'previous';
}

export const SyncedLine = (props: SyncedLineProps) => {
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
    setRomanization(canonicalize(await romanize(input)));
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
      class={`synced-line ${props.status}`}
      onClick={() => {
        _ytAPI?.seekTo((props.line.timeInMs + 10) / 1000);
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
