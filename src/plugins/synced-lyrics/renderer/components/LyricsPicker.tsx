import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Index,
  Match,
  onMount,
  Switch,
} from 'solid-js';

import {
  currentLyrics,
  lyricsStore,
  ProviderName,
  providerNames,
  ProviderState,
  setLyricsStore,
} from '../../providers';

import { _ytAPI } from '../index';

import type { YtIcons } from '@/types/icons';

export const providerIdx = createMemo(() =>
  providerNames.indexOf(lyricsStore.provider),
);

const shouldSwitchProvider = (providerData: ProviderState) => {
  if (providerData.state === 'error') return true;
  if (providerData.state === 'fetching') return true;
  return (
    providerData.state === 'done' &&
    !providerData.data?.lines &&
    !providerData.data?.lyrics
  );
};

const providerBias = (p: ProviderName) =>
  (lyricsStore.lyrics[p].state === 'done' ? 1 : -1) +
  (lyricsStore.lyrics[p].data?.lines?.length ? 2 : -1) +
  (lyricsStore.lyrics[p].data?.lines?.length && p === 'YTMusic' ? 1 : 0) +
  (lyricsStore.lyrics[p].data?.lyrics ? 1 : -1);

// prettier-ignore
const pickBestProvider = () => {
  const providers = Array.from(providerNames);

  providers.sort((a, b) => providerBias(b) - providerBias(a));

  return providers[0];
};

// prettier-ignore
export const LyricsPicker = () => {
  const [hasManuallySwitchedProvider, setHasManuallySwitchedProvider] = createSignal(false);
  createEffect(() => {
    // fallback to the next source, if the current one has an error
    if (!hasManuallySwitchedProvider()
    ) {
      const bestProvider = pickBestProvider();

      const allProvidersFailed = providerNames.every((p) => shouldSwitchProvider(lyricsStore.lyrics[p]));
      if (allProvidersFailed) return;

      if (providerBias(lyricsStore.provider) < providerBias(bestProvider)) {
        setLyricsStore('provider', bestProvider);
      }
    }
  });

  onMount(() => {
    const listener = (name: string) => {
      if (name !== 'dataloaded') return;
      setHasManuallySwitchedProvider(false);
    };

    _ytAPI?.addEventListener('videodatachange', listener);
    return () => _ytAPI?.removeEventListener('videodatachange', listener);
  });

  const next = (automatic: boolean = false) => {
    if (!automatic) setHasManuallySwitchedProvider(true);
    setLyricsStore('provider', (prevProvider) => {
      const idx = providerNames.indexOf(prevProvider);
      return providerNames[(idx + 1) % providerNames.length];
    });
  };

  const previous = (automatic: boolean = false) => {
    if (!automatic) setHasManuallySwitchedProvider(true);
    setLyricsStore('provider', (prevProvider) => {
      const idx = providerNames.indexOf(prevProvider);
      return providerNames[(idx + providerNames.length - 1) % providerNames.length];
    });
  };

  const chevronLeft: YtIcons = 'yt-icons:chevron_left';
  const chevronRight: YtIcons = 'yt-icons:chevron_right';

  const successIcon: YtIcons = 'yt-icons:check-circle';
  const errorIcon: YtIcons = 'yt-icons:error';
  const notFoundIcon: YtIcons = 'yt-icons:warning';


  return (
    <div class="lyrics-picker">
      <div class="lyrics-picker-left">
        <tp-yt-paper-icon-button icon={chevronLeft} onClick={() => previous()} />
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
                      (currentLyrics().data?.lines ||
                        currentLyrics().data?.lyrics)
                    }
                  >
                    <tp-yt-paper-icon-button
                      icon={successIcon}
                      tabindex="-1"
                      style={{ padding: '5px', transform: 'scale(0.5)' }}
                    />
                  </Match>
                  <Match when={
                      currentLyrics().state === 'done'
                      && !currentLyrics().data?.lines
                      && !currentLyrics().data?.lyrics
                    }>
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
        <tp-yt-paper-icon-button icon={chevronRight} onClick={() => next()} />
      </div>
    </div>
  );
};
