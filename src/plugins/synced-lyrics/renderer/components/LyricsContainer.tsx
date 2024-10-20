import { createSignal, For, Match, Switch } from 'solid-js';
import { SyncedLine } from './SyncedLine';

import { t } from '@/i18n';
import { currentProvider, lyricsStore } from '../../providers';

export const [debugInfo, setDebugInfo] = createSignal<string>();
export const [currentTime, setCurrentTime] = createSignal<number>(-1);

export const LyricsContainer = () => {
  return (
    <div class="lyric-container">
      <Switch>
        <Match when={currentProvider().error}>
          <yt-formatted-string
            class="warning-lyrics description ytmusic-description-shelf-renderer"
            text={{
              runs: [
                {
                  text: t('plugins.synced-lyrics.errors.fetch'),
                },
                { text: currentProvider().error! },
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

      <Switch fallback={<div></div>}>
        <Match when={currentProvider().data !== null}>
          <For each={currentProvider().data!.lines}>
            {(item) => <SyncedLine line={item} />}
          </For>
        </Match>
      </Switch>

      <yt-formatted-string
        class="ytmusic-description-shelf-renderer"
        text={{
          runs: [{ text: `Source: ${lyricsStore.provider}` }],
        }}
      />
    </div>
  );
};
