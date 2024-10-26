import { createEffect, createMemo, For } from 'solid-js';

import { currentTime } from './LyricsContainer';

import { config } from '../renderer';
import { _ytAPI } from '..';

import type { LineLyrics } from '../../types';

interface SyncedLineProps {
  line: LineLyrics;
}

export const SyncedLine = ({ line }: SyncedLineProps) => {
  const status = createMemo(() => {
    const current = currentTime();

    if (line.timeInMs >= current) return 'upcoming';
    if (current - line.timeInMs >= line.duration) return 'previous';
    return 'current';
  });

  let ref: HTMLDivElement;
  createEffect(() => {
    if (status() === 'current') {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  if (line.text == '') {
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
      ref={ref!}
      class={`synced-line ${status()}`}
      onClick={() => {
        _ytAPI?.seekTo(line.timeInMs / 1000);
      }}
    >
      <div class="text-lyrics description ytmusic-description-shelf-renderer">
        <yt-formatted-string
          text={{
            runs: [{ text: config()?.showTimeCodes ? `[${line.time}] ` : '' }],
          }}
        />

        <For each={line.text.split(' ')}>
          {(word, index) => {
            return (
              <span
                style={{
                  'transition-delay': `${index() * 0.05}s`,
                  'animation-delay': `${index() * 0.05}s`,
                  '--blyrics-duration:': `${line.duration / 1000}s;`,
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
      </div>
    </div>
  );
};
