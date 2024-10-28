/* eslint-disable import/order,@typescript-eslint/no-unused-vars */

import { createMemo, For, Index, Match, Switch } from 'solid-js';
import {
  currentLyrics,
  lyricsStore,
  providerNames,
  setLyricsStore,
} from '../../providers';
import type { YtIcons } from '@/types/icons';

export const providerIdx = createMemo(() =>
  providerNames.indexOf(lyricsStore.provider),
);

export const LyricsPicker = () => {
  const next = () =>
    setLyricsStore('provider', (prevProvider) => {
      const idx = providerNames.indexOf(prevProvider);
      return providerNames[(idx + 1) % providerNames.length];
    });
  const previous = () =>
    setLyricsStore('provider', (prevProvider) => {
      const idx = providerNames.indexOf(prevProvider);
      return providerNames[
        (idx + providerNames.length - 1) % providerNames.length
      ];
    });

  const chevronLeft: YtIcons = 'yt-icons:chevron_left';
  const chevronRight: YtIcons = 'yt-icons:chevron_right';

  const successIcon: YtIcons = 'yt-icons:check-circle';
  const errorIcon: YtIcons = 'yt-icons:error';
  const notFoundIcon: YtIcons = 'yt-icons:warning';

  // TODO: Make this work in a user-friendly way.
  // createEffect(() => {
  //   // fallback to the next source, if the current one has an error
  //   if (currentLyrics().state === 'error') next();
  // });

  return (
    <div class="lyrics-picker">
      <div class="lyrics-picker-left">
        <tp-yt-paper-icon-button icon={chevronLeft} onClick={previous} />
      </div>

      <div class="lyrics-picker-content">
        <div class="lyrics-picker-content-label">
          <Index each={providerNames}>
            {(provider) => (
              <div
                class="lyrics-picker-item"
                tabindex="-1"
                style={{
                  transform: `translateX(${providerIdx() * -100 - 5}%)`,
                }}
              >
                <Switch>
                  <Match
                    when={
                      // prettier-ignore
                      currentLyrics().state === 'fetching'
                    }
                  >
                    <tp-yt-paper-spinner-lite
                      active
                      tabindex="-1"
                      class="loading-indicator style-scope"
                      style={{ padding: '5px', transform: 'scale(0.5)' }}
                    />
                  </Match>
                  <Match when={currentLyrics().state === 'error'}>
                    <tp-yt-paper-icon-button
                      icon={errorIcon}
                      tabindex="-1"
                      style={{ padding: '5px', transform: 'scale(0.5)' }}
                    />
                  </Match>
                  <Match
                    when={
                      currentLyrics().state === 'done' &&
                      currentLyrics().data?.lines
                    }
                  >
                    <tp-yt-paper-icon-button
                      icon={successIcon}
                      tabindex="-1"
                      style={{ padding: '5px', transform: 'scale(0.5)' }}
                    />
                  </Match>
                  <Match when={currentLyrics().state === 'done'}>
                    <tp-yt-paper-icon-button
                      icon={notFoundIcon}
                      tabindex="-1"
                      style={{ padding: '5px', transform: 'scale(0.5)' }}
                    />
                  </Match>
                </Switch>
                <yt-formatted-string
                  class="description ytmusic-description-shelf-renderer"
                  text={{ runs: [{ text: provider() }] }}
                />
              </div>
            )}
          </Index>
        </div>

        <ul class="lyrics-picker-content-dots">
          <For each={providerNames}>
            {(_, idx) => (
              <li
                class="lyrics-picker-dot"
                onClick={() => setLyricsStore('provider', providerNames[idx()])}
                style={{
                  background: idx() === providerIdx() ? 'white' : 'black',
                }}
              />
            )}
          </For>
        </ul>
      </div>

      <div class="lyrics-picker-right">
        <tp-yt-paper-icon-button icon={chevronRight} onClick={next} />
      </div>
    </div>
  );
};
