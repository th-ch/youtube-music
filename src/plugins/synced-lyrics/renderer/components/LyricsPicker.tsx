/* eslint-disable import/order,@typescript-eslint/no-unused-vars */

import { createEffect, createMemo, createSignal, For, Match, Switch } from 'solid-js';
import { providers, searchResults } from '@/plugins/synced-lyrics/providers';
import type { Icons, YtIcons, YtSysIcons } from '@/types/icons';
import { renderCount } from '../renderer';

export const [providerIdx, setProviderIdx] = createSignal(0);

export const lyricsSource = createMemo(() => providers[providerIdx()]);
export const lyricsSourceState = createMemo(() => searchResults().data[lyricsSource().name]);

export const isLoading = createMemo(() => lyricsSourceState()?.state === 'fetching');
export const isError = createMemo(() => lyricsSourceState()?.state === 'error');
export const isDone = createMemo(() => lyricsSourceState()?.state === 'done');

export const LyricsPicker = () => {
  const next = () => setProviderIdx((i) => (i + 1) % providers.length);
  const previous = () => setProviderIdx((i) => (i + (providers.length - 1)) % providers.length);

  const chevronLeft: YtIcons = 'yt-icons:chevron_left';
  const chevronRight: YtIcons = 'yt-icons:chevron_right';
  const errorIcon: YtIcons = 'yt-icons:error';

  const status = createMemo(() => lyricsSourceState().state);
  createEffect(() => {
    // fallback to the next source, if the current one has an error
    if (status() === 'error') next();
  });

  return (
    <div class="lyrics-picker">
      <span style={{ display: "none" }}>{renderCount()}</span>
      <div class="lyrics-picker-left">
        <tp-yt-paper-icon-button icon={chevronLeft} onClick={previous} />
      </div>

      <div class="lyrics-picker-content">
        <div class="lyrics-picker-content-label">
          <For each={providers}>
            {(provider) => (
              <div
                class="lyrics-picker-item"
                style={{ transform: `translateX(${providerIdx() * -100}%)` }}
              >
                <yt-formatted-string
                  class="description ytmusic-description-shelf-renderer"
                  text={{ runs: [{ text: provider.name }] }}
                />
                <Switch>
                  <Match when={status() === "fetching"}>
                    <tp-yt-paper-spinner-lite active class="loading-indicator style-scope" />
                  </Match>
                  <Match when={status() === "error"}>
                    <tp-yt-paper-icon-button icon={errorIcon} />
                  </Match>
                </Switch>
              </div>
            )}
          </For>
        </div>

        <ul class="lyrics-picker-content-dots">
          <For each={providers}>
            {(_, idx) => (
              <li
                class="lyrics-picker-dot"
                onClick={() => setProviderIdx(idx())}
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
