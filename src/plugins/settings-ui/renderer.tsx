/// <reference types="vite/client" />

import { YtIcons } from '@/types/icons';
import { createRenderer } from '@/utils';
import { waitForElement } from '@/utils/wait-for-element';
import { createSignal, Show } from 'solid-js';
import { render, Portal } from 'solid-js/web';
import { t } from '@/i18n';
import { SettingsUI } from './SettingsUI';

const cogIcon: YtIcons = 'yt-icons:settings';

const SettingsButton = () => {
  const [showModal, setShowModal] = createSignal(false);

  return (
    <div
      class="ytmd-settings-ui-btn-content"
      on:click={() => {
        setShowModal(true);
      }}
    >
      <yt-icon icon={cogIcon} tabindex="0" />
      <div class="title-column style-scope ytmusic-guide-entry-renderer">
        <div class="title-group style-scope ytmusic-guide-entry-renderer">
          <yt-formatted-string
            class="title style-scope ytmusic-guide-entry-renderer"
            text={{ runs: [{ text: t('plugins.settings-ui.button') }] }}
          />
        </div>
      </div>
      <Portal>
        <Show when={showModal()}>
          <SettingsUI closeModal={() => setShowModal(false)} />
        </Show>
      </Portal>
    </div>
  );
};

const cleanup: Record<string, () => void> = {};

// prettier-ignore
const injectButton = (guide: HTMLElement) => {
  const items = guide.querySelector(
    "ytmusic-guide-section-renderer[is-primary] > #items",
  );
  if (!items) return;

  // dispose of the previous button
  cleanup[guide.id]?.();

  const entry = document.createElement("div");
  {
    const isMini = guide.id.startsWith("mini-");

    entry.classList.add("ytmd-settings-ui-btn");
    entry.classList.add(isMini ? "mini" : "normal");

    items.appendChild(entry);
  }

  const dispose = render(SettingsButton, entry);
  cleanup[guide.id] = dispose;
};

export const renderer = createRenderer({
  start() {
    waitForElement<HTMLElement>('#guide-renderer').then(injectButton);
    waitForElement<HTMLElement>('#mini-guide-renderer').then(injectButton);
  },
  stop() {
    cleanup['guide-renderer']?.();
    cleanup['mini-guide-renderer']?.();
  },
});

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', () => {
    for (const key in cleanup) {
      const guide = document.getElementById(key);

      cleanup[key]();
      waitForElement<HTMLElement>(`#${guide}`).then(injectButton);
    }
  });
}
