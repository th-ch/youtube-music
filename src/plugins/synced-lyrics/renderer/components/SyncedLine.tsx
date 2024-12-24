import { createEffect, createMemo } from 'solid-js';

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

  let ref: HTMLDivElement | undefined;
  createEffect(() => {
    if (status() === 'current') {
      ref?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  const text = createMemo(() => {
    if (line.text.trim()) return line.text;
    return config()?.defaultTextString ?? '';
  });

  // prettier-ignore
  return (
    <div
      ref={ref}
      class={`synced-line ${status()}`}
      onClick={() => {
        _ytAPI?.seekTo(line.timeInMs / 1000);
      }}
    >
      <yt-formatted-string
        class="text-lyrics description ytmusic-description-shelf-renderer"
        text={{
          runs: [
            { text: config()?.showTimeCodes ? `[${line.time}]` : '' },
            { text: text() }],
        }}
      />
    </div>
  );
};
