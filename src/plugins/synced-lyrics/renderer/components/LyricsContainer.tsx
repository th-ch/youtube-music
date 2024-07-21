/* eslint-disable import/order */

import { createSignal, For } from 'solid-js';
import { SyncedLine } from './SyncedLine';
import { LineLyrics } from '../../types';

export const [lineLyrics, setLineLyrics] = createSignal<LineLyrics[]>([]);
export const [currentTime, setCurrentTime] = createSignal<number>(-1);

export const LyricsContainer = () => {
  return (
    <div>
      <For each={lineLyrics()}>
        {(item) => {
          return <SyncedLine line={item} />;
        }}
      </For>

      <span
        class="footer style-scope ytmusic-description-shelf-renderer"
        style="align-self: baseline"
      >
        Source: LRCLIB
      </span>
    </div>
  );
};
