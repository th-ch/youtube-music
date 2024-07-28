/* eslint-disable import/order */

import { createEffect, createMemo } from 'solid-js';
import { config } from '../renderer';
import { currentTime } from './LyricsContainer';
import type { LineLyrics } from '../../types';
import { _ytAPI } from '..';

interface SyncedLineProps {
  line: LineLyrics;
}

export const SyncedLine = ({ line }: SyncedLineProps) => {
  const status = createMemo(() =>
    line.timeInMs < currentTime()
      ? currentTime() - line.timeInMs >= line.duration
        ? 'previous'
        : 'current'
      : 'upcoming',
  );

  let ref: HTMLDivElement;
  createEffect(() => {
    if (status() === 'current') {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  return (
    <div
      ref={ref!}
      class={`synced-line ${status()}`}
      onClick={() => {
        _ytAPI?.seekTo(line.timeInMs / 1000);
      }}
    >
      <span class="text-lyrics">
        {config()?.showTimeCodes && `[${line.time}] `}
        {line.text}
      </span>
    </div>
  );
};
