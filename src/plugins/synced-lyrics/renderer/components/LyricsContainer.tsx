import { createSignal, For, Match, Show, Switch } from 'solid-js';
import { SyncedLine } from './SyncedLine';

import { t } from '@/i18n';
import { currentLyrics, lyricsStore } from '../../providers';

export const [debugInfo, setDebugInfo] = createSignal<string>();
export const [currentTime, setCurrentTime] = createSignal<number>(-1);

export const LyricsContainer = () => {
  return (
    <div class="lyric-container">
      <Switch>
        <Match when={lyricsStore.current.error}>
          <yt-formatted-string
            class="warning-lyrics description ytmusic-description-shelf-renderer"
            text={{
              runs: [
                {
                  text: t('plugins.synced-lyrics.errors.fetch'),
                },
                { text: lyricsStore.current.error! },
              ],
            }}
          />
        </Match>
      </Switch>

      {/*<Switch>*/}
      {/*  <Match when={!result()?.lines?.length}>*/}
      {/*    <Show*/}
      {/*      when={isInstrumental()}*/}
      {/*      fallback={*/}
      {/*        <>*/}
      {/*          <yt-formatted-string*/}
      {/*            class="warning-lyrics description ytmusic-description-shelf-renderer"*/}
      {/*            text={{*/}
      {/*              runs: [{*/}
      {/*                text: t('plugins.synced-lyrics.errors.not-found'),*/}
      {/*              }],*/}
      {/*            }}*/}
      {/*            style={'margin-bottom: 16px;'}*/}
      {/*          />*/}
      {/*          <yt-button-renderer*/}
      {/*            disabled={isFetching()}*/}
      {/*            data={{*/}
      {/*              icon: { iconType: 'REFRESH' },*/}
      {/*              isDisabled: false,*/}
      {/*              style: 'STYLE_DEFAULT',*/}
      {/*              text: {*/}
      {/*                simpleText: isFetching()*/}
      {/*                  ? t('plugins.synced-lyrics.refetch-btn.fetching')*/}
      {/*                  : t('plugins.synced-lyrics.refetch-btn.normal'),*/}
      {/*              },*/}
      {/*            }}*/}
      {/*            onClick={fetch}*/}
      {/*          />*/}
      {/*        </>*/}
      {/*      }*/}
      {/*    >*/}
      {/*      <yt-formatted-string*/}
      {/*        class="warning-lyrics description ytmusic-description-shelf-renderer"*/}
      {/*        text={{*/}
      {/*          runs: [{*/}
      {/*            text: t('plugins.synced-lyrics.warnings.instrumental'),*/}
      {/*          }],*/}
      {/*        }}*/}
      {/*      />*/}
      {/*    </Show>*/}
      {/*  </Match>*/}
      {/*  <Match when={result()?.lines?.length && !hadSecondAttempt()}>*/}
      {/*    <yt-formatted-string*/}
      {/*      class="warning-lyrics description ytmusic-description-shelf-renderer"*/}
      {/*      text={{*/}
      {/*        runs: [{*/}
      {/*          text: t('plugins.synced-lyrics.warnings.inexact'),*/}
      {/*        }],*/}
      {/*      }}*/}
      {/*    />*/}
      {/*  </Match>*/}
      {/*  <Match when={result()?.lines?.length && !differentDuration()}>*/}
      {/*    <yt-formatted-string*/}
      {/*      class="warning-lyrics description ytmusic-description-shelf-renderer"*/}
      {/*      text={{*/}
      {/*        runs: [{*/}
      {/*          text: t('plugins.synced-lyrics.warnings.duration-mismatch'),*/}
      {/*        }],*/}
      {/*      }}*/}
      {/*    />*/}
      {/*  </Match>*/}
      {/*</Switch>*/}

      <For each={currentLyrics().data?.lines}>
        {(item) => <SyncedLine line={item} />}
      </For>
      <Show when={!currentLyrics().data?.lines}>
        <yt-formatted-string
          class="text-lyrics description ytmusic-description-shelf-renderer"
          style={{
            display: 'inline-flex',
            'justify-content': 'center',
            width: '100%',
          }}
          text={{
            runs: [{ text: '(°ロ°) !' }],
          }}
        />
      </Show>
    </div>
  );
};
