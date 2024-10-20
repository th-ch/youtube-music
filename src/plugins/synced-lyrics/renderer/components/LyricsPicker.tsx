/* eslint-disable import/order,@typescript-eslint/no-unused-vars */

import { createEffect, createMemo, For, Match, Switch } from 'solid-js';
import {
  lyricsStore,
  providerNames,
  setLyricsStore,
} from '@/plugins/synced-lyrics/providers';
import type { YtIcons } from '@/types/icons';

export const providerIdx = createMemo(() =>
  providerNames.indexOf(lyricsStore.provider)
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
  const errorIcon: YtIcons = 'yt-icons:error';

  createEffect(() => {
    // fallback to the next source, if the current one has an error
    if (lyricsStore.lyrics[lyricsStore.provider].state === 'error') next();
  });

  return (
    <div class="lyrics-picker">
      <div class="lyrics-picker-left">
        <tp-yt-paper-icon-button icon={chevronLeft} onClick={previous} />
      </div>

      <div class="lyrics-picker-content">
        <div class="lyrics-picker-content-label">
          <For each={providerNames}>
            {(provider, idx) => (
              <div
                class="lyrics-picker-item"
                style={{ transform: `translateX(${providerIdx() * -100}%)` }}
              >
                <span style={{ display: 'none' }}>
                  {lyricsStore.lyrics[providerNames[idx()]].state}
                </span>
                <yt-formatted-string
                  class="description ytmusic-description-shelf-renderer"
                  text={{ runs: [{ text: provider }] }}
                />
                <Switch>
                  <Match
                    when={
                      lyricsStore.lyrics[providerNames[idx()]].state ===
                      'fetching'
                    }
                  >
                    <tp-yt-paper-spinner-lite
                      active
                      class="loading-indicator style-scope"
                    />
                  </Match>
                  <Match
                    when={
                      lyricsStore.lyrics[providerNames[idx()]].state === 'error'
                    }
                  >
                    <tp-yt-paper-icon-button icon={errorIcon} />
                  </Match>
                </Switch>
              </div>
            )}
          </For>
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
