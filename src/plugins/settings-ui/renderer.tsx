/// <reference types="vite/client" />

import { createSignal, Show } from 'solid-js';
import { render, Portal } from 'solid-js/web';
import { t } from '@/i18n';

import { createRenderer } from '@/utils';
import { waitForElement } from '@/utils/wait-for-element';
import SettingsModal from './components/SettingsModal';
import { DefaultConfig } from '@/config/defaults';

const SettingsButton = () => {
  const [showModal, setShowModal] = createSignal(false);

  return (
    <div
      class="ytmd-settings-ui-btn-content"
      on:click={() => {
        setShowModal(true);
      }}
    >
      <yt-icon icon="yt-icons:settings" tabindex="0" />
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
          <SettingsModal close={() => setShowModal(false)} />
        </Show>
      </Portal>
    </div>
  );
};

const cleanup: Record<string, () => void> = {};
const dispose = () => {
  for (const key in cleanup) {
    cleanup[key]();
    waitForElement<HTMLElement>(`#${key}`).then(injectButton);
  }
};

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
  cleanup[guide.id] = () => {
    dispose();
    entry.remove()
  };
};

export let getAppVersion = () => Promise.resolve('');
export let getPlatform = () => Promise.resolve('');
export let getVersions = () => Promise.resolve({});

// stubs
export let plugins = {
  enable: (_id: string) => {},
  disable: (_id: string) => {},
  isEnabled: (_id: string) => Promise.resolve(false),
};

// prettier-ignore
export let loadSettings: () => Promise<DefaultConfig>;

// prettier-ignore
export const renderer = createRenderer({
  start(ctx) {
    getAppVersion = () => ctx.ipc.invoke('ytmd-sui:app-version');
    getPlatform = () => ctx.ipc.invoke('ytmd-sui:platform');
    getVersions = () => ctx.ipc.invoke('ytmd-sui:versions');
    loadSettings = () => ctx.ipc.invoke('ytmd-sui:load-settings');

    plugins.enable = (id: string) => ctx.ipc.invoke('ytmd-sui:plugins-enable', id);
    plugins.disable = (id: string) => ctx.ipc.invoke('ytmd-sui:plugins-disable', id);
    plugins.isEnabled = (id: string) => ctx.ipc.invoke('ytmd-sui:plugins-isEnabled', id);

    waitForElement<HTMLElement>('#guide-renderer').then(injectButton);
    waitForElement<HTMLElement>('#mini-guide-renderer').then(injectButton);
  },
  stop() {
    cleanup['guide-renderer']?.();
    cleanup['mini-guide-renderer']?.();
  },
});

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(dispose);
}
