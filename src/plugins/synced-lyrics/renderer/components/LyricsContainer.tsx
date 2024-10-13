import { createSignal, For, Match, Show, Switch } from 'solid-js';

import { SyncedLine } from './SyncedLine';

import { t } from '@/i18n';
import { getSongInfo } from '@/providers/song-info-front';

import {
  differentDuration,
  hadSecondAttempt,
  isFetching,
  isInstrumental,
  makeLyricsRequest,
} from '../lyrics/fetch';

import type { LineLyrics } from '../../types';

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
      setError(String(err));
    });
  };

  return (
    <div class={'lyric-container'}>
      <Switch>
        <Match when={isFetching()}>
          <div style="margin-bottom: 8px;">
            <tp-yt-paper-spinner-lite
              active
              class="loading-indicator style-scope"
            />
          </div>
        </Match>
        <Match when={error()}>
          <yt-formatted-string
            class="warning-lyrics description ytmusic-description-shelf-renderer"
            text={{
              runs: [
                {
                  text: t('plugins.synced-lyrics.errors.fetch'),
                },
              ],
            }}
          />
        </Match>
      </Switch>

      <Switch>
        <Match when={!lineLyrics().length}>
          <Show
            when={isInstrumental()}
            fallback={
              <>
                <yt-formatted-string
                  class="warning-lyrics description ytmusic-description-shelf-renderer"
                  text={{
                    runs: [
                      {
                        text: t('plugins.synced-lyrics.errors.not-found'),
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
                      simpleText: isFetching()
                        ? t('plugins.synced-lyrics.refetch-btn.fetching')
                        : t('plugins.synced-lyrics.refetch-btn.normal'),
                    },
                  }}
                  onClick={onRefetch}
                />
              </>
            }
          >
            <yt-formatted-string
              class="warning-lyrics description ytmusic-description-shelf-renderer"
              text={{
                runs: [
                  {
                    text: t('plugins.synced-lyrics.warnings.instrumental'),
                  },
                ],
              }}
            />
          </Show>
        </Match>
        <Match when={lineLyrics().length && !hadSecondAttempt()}>
          <yt-formatted-string
            class="warning-lyrics description ytmusic-description-shelf-renderer"
            text={{
              runs: [
                {
                  text: t('plugins.synced-lyrics.warnings.inexact'),
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
                  text: t('plugins.synced-lyrics.warnings.duration-mismatch'),
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
