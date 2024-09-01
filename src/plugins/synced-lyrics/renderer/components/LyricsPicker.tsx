/* eslint-disable import/order,@typescript-eslint/no-unused-vars */

import { createSignal, For } from 'solid-js';
import type { YtIcons } from '@/types/icons';
import { providers } from '@/plugins/synced-lyrics/providers';

export const [providerIdx, setProviderIdx] = createSignal(0);
export const LyricsPicker = () => {
  const next = () => setProviderIdx((i) => (i + 1) % providers.length);
  const previous = () => setProviderIdx((i) => (i - 1 + providers.length) % providers.length);

  const chevronLeft: YtIcons = 'yt-icons:chevron_left';
  const chevronRight: YtIcons = 'yt-icons:chevron_right';

  return (
    <div class="lyrics-picker">
      <tp-yt-paper-icon-button class="lyrics-picker-left" icon={chevronLeft} onClick={previous} />

      <div class="lyrics-picker-content">
        <div class="lyrics-picker-content-label">
          <For each={providers}>{(provider) => (
            <div class="lyrics-picker-item" style={{ transform: `translateX(${providerIdx() * -100}%)` }}>
              <yt-formatted-string
                class="description ytmusic-description-shelf-renderer"
                text={{ runs: [{ text: provider.name }] }}
              />
            </div>
          )}</For>
        </div>

        <ul class="lyrics-picker-content-dots">
          <For each={providers}>{(_, idx) =>
            <li
              class="lyrics-picker-dot"
              onClick={() => setProviderIdx(idx())}
              style={{
                'background': (idx() === providerIdx()
                    ? 'white'
                    : 'black'
                )
              }}
            />
          }</For>
        </ul>
      </div>

      <tp-yt-paper-icon-button class="lyrics-picker-right" icon={chevronRight} onClick={next} />
    </div>
  );
};
