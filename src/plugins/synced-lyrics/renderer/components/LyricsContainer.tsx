import { createSignal, For, Match, Show, Switch } from 'solid-js';

import { SyncedLine } from './SyncedLine';

import { getSongInfo } from '@/providers/song-info-front';

import { LineLyrics } from '../../types';
import {
  differentDuration,
  hadSecondAttempt,
  isFetching,
  isInstrumental,
  makeLyricsRequest,
} from '../lyrics/fetch';

export const [debugInfo, setDebugInfo] = createSignal<string>();
export const [lineLyrics, setLineLyrics] = createSignal<LineLyrics[]>([]);
export const [currentTime, setCurrentTime] = createSignal<number>(-1);

export const LyricsContainer = () => {
  const [error, setError] = createSignal('');

  const onRefetch = async () => {
    if (isFetching()) return;
    setError('');

    const info = getSongInfo();
    await makeLyricsRequest(info).catch((err) => {
      setError(`${err}`);
    });
  };

  return (
    <div class={'lyric-container'}>
      <Switch>
        <Match when={isFetching()}>
          <div style={'margin-bottom: 8px;'}>
            <tp-yt-paper-spinner-lite
              active
              class={'loading-indicator style-scope'}
            />
          </div>
        </Match>
        <Match when={error()}>
          <yt-formatted-string
            class="warning-lyrics description ytmusic-description-shelf-renderer"
            text={{
              runs: [
                {
                  text: 'An error occurred while fetching the lyrics. Please try again later.',
                },
              ],
            }}
          />
        </Match>
      </Switch>

      <Switch>
        <Match when={!lineLyrics().length}>
          <Show when={isInstrumental()}>
            <yt-formatted-string
              class="warning-lyrics description ytmusic-description-shelf-renderer"
              text={{
                runs: [
                  {
                    text: '⚠️ - This is an instrumental song',
                  },
                ],
              }}
            />
          </Show>
          <Show when={!isInstrumental()}>
            <yt-formatted-string
              class="warning-lyrics description ytmusic-description-shelf-renderer"
              text={{
                runs: [
                  {
                    text: 'No lyrics found for this song.',
                  },
                ],
              }}
              style={'margin-bottom: 16px;'}
            />
            <yt-button-renderer
              disabled={isFetching()}
              data={{
                icon: { iconType: 'REFRESH' },
                isDisabled: false,
                style: 'STYLE_DEFAULT',
                text: {
                  simpleText: isFetching() ? 'Fetching...' : 'Refetch lyrics',
                },
              }}
              onClick={onRefetch}
            />
          </Show>
        </Match>
        <Match when={lineLyrics().length && !hadSecondAttempt()}>
          <yt-formatted-string
            class="warning-lyrics description ytmusic-description-shelf-renderer"
            text={{
              runs: [
                {
                  text: '⚠️ - The lyrics for this song may not be exact',
                },
              ],
            }}
          />
        </Match>
        <Match when={lineLyrics().length && !differentDuration()}>
          <yt-formatted-string
            class="warning-lyrics description ytmusic-description-shelf-renderer"
            text={{
              runs: [
                {
                  text: '⚠️ - The lyrics may be out of sync due to a duration mismatch.',
                },
              ],
            }}
          />
        </Match>
      </Switch>

      <For each={lineLyrics()}>{(item) => <SyncedLine line={item} />}</For>

      <yt-formatted-string
        class="footer style-scope ytmusic-description-shelf-renderer"
        text={{
          runs: [
            {
              text: 'Source: LRCLIB',
            },
          ],
        }}
      />
    </div>
  );
};
