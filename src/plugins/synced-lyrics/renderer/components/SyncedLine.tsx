/* eslint-disable import/order */

import { createMemo } from 'solid-js';
import { config } from '../renderer';
import { currentTime } from './LyricsContainer';
import type { LineLyrics } from '../../types';

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

  return (
    <div class={`synced-line ${status()}`} data-index={line.index}>
      <span class="text-lyrics">
        {config()?.showTimeCodes && `[${line.time}] `}
        {line.text}
      </span>
    </div>
  );
};
