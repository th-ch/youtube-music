import { createEffect, For, Show, createSignal, createMemo } from 'solid-js';

import { type VirtualizerHandle } from 'virtua/solid';

import { type LineLyrics } from '@/plugins/synced-lyrics/types';

import { config, currentTime } from '../renderer';
import { _ytAPI } from '..';

import { canonicalize, romanize, simplifyUnicode, getSeekTime } from '../utils';

interface SyncedLineProps {
  scroller: VirtualizerHandle;
  index: number;

  line: LineLyrics;
  status: 'upcoming' | 'current' | 'previous';
  isFinalLine?: boolean;
  isFirstEmptyLine?: boolean;
}

function formatTime(timeInMs: number, preciseTiming: boolean): string {
  if (!preciseTiming) {
    const totalSeconds = Math.round(timeInMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  const minutes = Math.floor(timeInMs / 60000);
  const seconds = Math.floor((timeInMs % 60000) / 1000);
  const ms = Math.floor((timeInMs % 1000) / 10);

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

const EmptyLine = (props: SyncedLineProps) => {
  const states = createMemo(() => {
    const defaultText = config()?.defaultTextString ?? '';
    return Array.isArray(defaultText) ? defaultText : [defaultText];
  });

  const index = createMemo(() => {
    const progress = currentTime() - props.line.timeInMs;
    const total = props.line.duration;
    const stepCount = states().length;
    const precise = config()?.preciseTiming ?? false;

    if (stepCount === 1) return 0;

    let earlyCut: number;
    if (total > 3000) {
      earlyCut = 1000;
    } else if (total >= 1000) {
      const ratio = (total - 1000) / 2000;
      const addend = ratio * 500;
      earlyCut = 500 + addend;
    } else {
      earlyCut = Math.min(total * 0.8, total - 150);
    }

    const effectiveTotal =
      total <= 1000
        ? total - earlyCut
        : precise
          ? total - earlyCut
          : Math.round((total - earlyCut) / 1000) * 1000;

    if (effectiveTotal <= 0) return 0;

    const effectiveProgress = precise
      ? progress
      : Math.round(progress / 1000) * 1000;
    const percentage = Math.min(1, effectiveProgress / effectiveTotal);

    return Math.max(0, Math.floor((stepCount - 1) * percentage));
  });

  const shouldRenderPlaceholder = createMemo(() => {
    const isEmpty = !props.line.text?.trim();
    const showEmptySymbols = config()?.showEmptyLineSymbols ?? false;

    return isEmpty
      ? showEmptySymbols || props.status === 'current'
      : props.status === 'current';
  });

  const isHighlighted = createMemo(() => props.status === 'current');
  const isFinalEmpty = createMemo(() => {
    return props.isFinalLine && !props.line.text?.trim();
  });

  const shouldRemovePadding = createMemo(() => {
    // remove padding only when this is the first empty line and the configured label is blank (empty string or NBSP)
    if (!props.isFirstEmptyLine) return false;
    const defaultText = config()?.defaultTextString ?? '';
    const first = Array.isArray(defaultText) ? defaultText[0] : defaultText;
    return first === '' || first === '\u00A0';
  });

  return (
    <div
      class={`synced-emptyline ${props.status} ${isFinalEmpty() ? 'final-empty' : ''} ${shouldRemovePadding() ? 'no-padding' : ''}`}
      onClick={() => {
        const precise = config()?.preciseTiming ?? false;
        _ytAPI?.seekTo(getSeekTime(props.line.timeInMs, precise));
      }}
    >
      <div class="description ytmusic-description-shelf-renderer" dir="auto">
        <yt-formatted-string
          text={{
            runs: [
              {
                text: config()?.showTimeCodes
                  ? `[${formatTime(
                      props.line.timeInMs,
                      config()?.preciseTiming ?? false,
                    )}] `
                  : '',
              },
            ],
          }}
        />
        <div class="text-lyrics">
          {props.isFinalLine && !props.line.text?.trim() ? (
            <span>
              <span class={`fade ${isHighlighted() ? 'show' : ''}`}>
                <yt-formatted-string text={{ runs: [{ text: '' }] }} />
              </span>
            </span>
          ) : (
            <For each={states()}>
              {(text, i) => (
                <span
                  class={`fade ${
                    shouldRenderPlaceholder()
                      ? i() <= index()
                        ? isHighlighted()
                          ? 'show'
                          : 'placeholder'
                        : 'dim'
                      : ''
                  }`}
                >
                  <yt-formatted-string text={{ runs: [{ text }] }} />
                </span>
              )}
            </For>
          )}
        </div>
      </div>
    </div>
  );
};

export const SyncedLine = (props: SyncedLineProps) => {
  const text = createMemo(() => props.line.text.trim());

  const [romanization, setRomanization] = createSignal('');
  createEffect(() => {
    const input = canonicalize(text());
    if (!config()?.romanization) return;

    romanize(input).then((result) => {
      setRomanization(canonicalize(result));
    });
  });

  return (
    <Show fallback={<EmptyLine {...props} />} when={text()}>
      <div
        class={`synced-line ${props.status}`}
        onClick={() => {
          const precise = config()?.preciseTiming ?? false;
          _ytAPI?.seekTo(getSeekTime(props.line.timeInMs, precise));
        }}
      >
        <div class="description ytmusic-description-shelf-renderer" dir="auto">
          <yt-formatted-string
            text={{
              runs: [
                {
                  text: config()?.showTimeCodes
                    ? `[${formatTime(props.line.timeInMs, config()?.preciseTiming ?? false)}] `
                    : '',
                },
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
    </Show>
  );
};
