import { createEffect, createMemo, createSignal, Show } from 'solid-js';
import { VirtualizerHandle, VList } from 'virtua/solid';

import { LyricsPicker } from './components/LyricsPicker';

import { hasJapaneseInString, hasKoreanInString } from './utils';

import type { LineLyrics, SyncedLyricsPluginConfig } from '../types';
import { currentLyrics } from '../providers';
import {
  ErrorDisplay,
  LoadingKaomoji,
  NotFoundKaomoji,
  SyncedLine,
  PlainLyrics,
} from './components';

export const [isVisible, setIsVisible] = createSignal<boolean>(false);
export const [config, setConfig] =
  createSignal<SyncedLyricsPluginConfig | null>(null);

createEffect(() => {
  if (!config()?.enabled) return;
  const root = document.documentElement;

  // Set the line effect
  switch (config()?.lineEffect) {
    case 'fancy':
      root.style.setProperty('--lyrics-font-size', '3rem');
      root.style.setProperty('--lyrics-line-height', '1.333');
      root.style.setProperty('--lyrics-width', '100%');
      root.style.setProperty('--lyrics-padding', '2rem');
      root.style.setProperty(
        '--lyrics-animations',
        'lyrics-glow var(--lyrics-glow-duration) forwards, lyrics-wobble var(--lyrics-wobble-duration) forwards',
      );

      root.style.setProperty('--lyrics-inactive-font-weight', '700');
      root.style.setProperty('--lyrics-inactive-opacity', '0.33');
      root.style.setProperty('--lyrics-inactive-scale', '0.95');
      root.style.setProperty('--lyrics-inactive-offset', '0');

      root.style.setProperty('--lyrics-active-font-weight', '700');
      root.style.setProperty('--lyrics-active-opacity', '1');
      root.style.setProperty('--lyrics-active-scale', '1');
      root.style.setProperty('--lyrics-active-offset', '0');
      break;
    case 'scale':
      root.style.setProperty(
        '--lyrics-font-size',
        'clamp(1.4rem, 1.1vmax, 3rem)',
      );
      root.style.setProperty(
        '--lyrics-line-height',
        'var(--ytmusic-body-line-height)',
      );
      root.style.setProperty('--lyrics-width', '83%');
      root.style.setProperty('--lyrics-padding', '0');
      root.style.setProperty('--lyrics-animations', 'none');

      root.style.setProperty('--lyrics-inactive-font-weight', '400');
      root.style.setProperty('--lyrics-inactive-opacity', '0.33');
      root.style.setProperty('--lyrics-inactive-scale', '1');
      root.style.setProperty('--lyrics-inactive-offset', '0');

      root.style.setProperty('--lyrics-active-font-weight', '700');
      root.style.setProperty('--lyrics-active-opacity', '1');
      root.style.setProperty('--lyrics-active-scale', '1.2');
      root.style.setProperty('--lyrics-active-offset', '0');
      break;
    case 'offset':
      root.style.setProperty(
        '--lyrics-font-size',
        'clamp(1.4rem, 1.1vmax, 3rem)',
      );
      root.style.setProperty(
        '--lyrics-line-height',
        'var(--ytmusic-body-line-height)',
      );
      root.style.setProperty('--lyrics-width', '100%');
      root.style.setProperty('--lyrics-padding', '0');
      root.style.setProperty('--lyrics-animations', 'none');

      root.style.setProperty('--lyrics-inactive-font-weight', '400');
      root.style.setProperty('--lyrics-inactive-opacity', '0.33');
      root.style.setProperty('--lyrics-inactive-scale', '1');
      root.style.setProperty('--lyrics-inactive-offset', '0');

      root.style.setProperty('--lyrics-active-font-weight', '700');
      root.style.setProperty('--lyrics-active-opacity', '1');
      root.style.setProperty('--lyrics-active-scale', '1');
      root.style.setProperty('--lyrics-active-offset', '5%');
      break;
    case 'focus':
      root.style.setProperty(
        '--lyrics-font-size',
        'clamp(1.4rem, 1.1vmax, 3rem)',
      );
      root.style.setProperty(
        '--lyrics-line-height',
        'var(--ytmusic-body-line-height)',
      );
      root.style.setProperty('--lyrics-width', '100%');
      root.style.setProperty('--lyrics-padding', '0');
      root.style.setProperty('--lyrics-animations', 'none');

      root.style.setProperty('--lyrics-inactive-font-weight', '400');
      root.style.setProperty('--lyrics-inactive-opacity', '0.33');
      root.style.setProperty('--lyrics-inactive-scale', '1');
      root.style.setProperty('--lyrics-inactive-offset', '0');

      root.style.setProperty('--lyrics-active-font-weight', '700');
      root.style.setProperty('--lyrics-active-opacity', '1');
      root.style.setProperty('--lyrics-active-scale', '1');
      root.style.setProperty('--lyrics-active-offset', '0');
      break;
  }
});

type LyricsRendererChild =
  | { kind: 'LyricsPicker' }
  | { kind: 'LoadingKaomoji' }
  | { kind: 'NotFoundKaomoji' }
  | { kind: 'Error'; error: Error }
  | {
      kind: 'SyncedLine';
      line: LineLyrics;
    }
  | {
      kind: 'PlainLine';
      line: string;
    };

export const [currentTime, setCurrentTime] = createSignal<number>(-1);
export const LyricsRenderer = () => {
  // const [stickyRef, setStickRef] = createSignal<HTMLElement | null>(null);

  // const tab = document.querySelector<HTMLElement>(selectors.body.tabRenderer)!;

  // const mousemoveListener = (e: MouseEvent) => {
  //   const { top } = tab.getBoundingClientRect();
  //   const { clientHeight: height } = stickyRef()!;

  //   const showPicker = e.clientY - top - 5 <= height;
  //   if (showPicker) {
  //     // picker visible
  //     stickyRef()!.style.setProperty('--top', '0');
  //   } else {
  //     // picker hidden
  //     stickyRef()!.style.setProperty('--top', '-50%');
  //   }
  // };

  // onMount(() => tab.addEventListener('mousemove', mousemoveListener));
  // onCleanup(() => tab.removeEventListener('mousemove', mousemoveListener));

  const [scroller, setScroller] = createSignal<VirtualizerHandle>();
  const [children, setChildren] = createSignal<LyricsRendererChild[]>([
    { kind: 'LoadingKaomoji' },
  ]);

  createEffect(() => {
    const current = currentLyrics();
    if (!current) {
      setChildren(() => [{ kind: 'NotFoundKaomoji' }]);
      return;
    }

    const { state, data, error } = current;

    setChildren(() => {
      if (state === 'fetching') {
        return [{ kind: 'LoadingKaomoji' }];
      }

      if (state === 'error') {
        return [{ kind: 'Error', error: error! }];
      }

      if (data?.lines) {
        return data.lines!.map((line) => ({
          kind: 'SyncedLine' as const,
          line,
        }));
      }

      if (data?.lyrics) {
        const lines = data.lyrics.split('\n').filter((line) => line.trim());
        return lines.map((line) => ({
          kind: 'PlainLine' as const,
          line,
        }));
      }

      return [{ kind: 'NotFoundKaomoji' }];
    });
  });

  const hasKorean = createMemo(() => {
    const data = currentLyrics()?.data;
    if (!data) return false;

    return hasKoreanInString(data);
  }, false);

  const hasJapanese = createMemo(() => {
    const data = currentLyrics()?.data;
    if (!data) return false;

    return hasJapaneseInString(data);
  }, false);

  const statuses = createMemo(() => {
    const time = currentTime();
    const data = currentLyrics()?.data;
    if (!data || !data.lines) return [];

    return data.lines.map((line) => {
      if (line.timeInMs >= time) return 'upcoming';
      if (time - line.timeInMs >= line.duration) return 'previous';
      return 'current';
    });
  }, []);

  const [currentIndex, setCurrentIndex] = createSignal(0);
  createEffect(() => {
    const index = statuses().findIndex((status) => status === 'current');
    if (index === -1) return;
    setCurrentIndex(index);
  });

  createEffect(() => {
    const current = currentLyrics();
    if (!scroller() || !current.data?.lines) return;

    scroller()!.scrollToIndex(currentIndex(), {
      smooth: true,
      align: 'center',
    });
  });

  return (
    <Show when={isVisible()}>
      <VList
        {...{
          ref: setScroller,
          style: { 'scrollbar-width': 'none' },
          // keepMounted: [0],
        }}
        data={[{ kind: 'LyricsPicker' } as LyricsRendererChild, ...children()]}
      >
        {(props, idx) => {
          if (typeof props === 'undefined') return null;
          switch (props.kind) {
            case 'LyricsPicker':
              return <LyricsPicker />;
            case 'Error':
              return <ErrorDisplay {...props} />;
            case 'LoadingKaomoji':
              return <LoadingKaomoji />;
            case 'NotFoundKaomoji':
              return <NotFoundKaomoji />;
            case 'SyncedLine': {
              return (
                <SyncedLine
                  {...props}
                  scroller={scroller()!}
                  index={idx}
                  status={statuses()[idx - 1]}
                  hasJapanese={hasJapanese()}
                  hasKorean={hasKorean()}
                />
              );
            }
            case 'PlainLine': {
              return (
                <PlainLyrics
                  {...props}
                  hasJapanese={hasJapanese()}
                  hasKorean={hasKorean()}
                />
              );
            }
          }
        }}
      </VList>
    </Show>
  );
};
