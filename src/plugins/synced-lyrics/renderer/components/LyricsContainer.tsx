/* eslint-disable import/order */

import { createSignal, For, Show } from 'solid-js';
import { SyncedLine } from './SyncedLine';
import { LineLyrics } from '../../types';
import { differentDuration, hadSecondAttempt } from '../lyrics/fetch';

export const [debugInfo, setDebugInfo] = createSignal<string>();
export const [lineLyrics, setLineLyrics] = createSignal<LineLyrics[]>([]);
export const [currentTime, setCurrentTime] = createSignal<number>(-1);

export const LyricsContainer = () => {
  return (
    <div>
      <Show
        when={
          !!lineLyrics().length && (hadSecondAttempt() || differentDuration())
        }
      >
        <div class="warning-lyrics">
          <Show when={hadSecondAttempt()}>
            <p>⚠️ - The lyrics for this song may not be exact</p>
          </Show>
          <Show when={differentDuration()}>
            <p>
              ⚠️ - The lyrics may be out of sync due to a duration mismatch.
            </p>
          </Show>
        </div>
      </Show>

      <Show when={!lineLyrics().length}>
        <div class="warning-lyrics" style="color: white;">
          {debugInfo()}
        </div>
      </Show>

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
