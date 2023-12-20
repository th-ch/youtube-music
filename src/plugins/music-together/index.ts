import { DataConnection, Peer } from 'peerjs';
import prompt from 'custom-electron-prompt';

import { createPlugin } from '@/utils';
import { t } from '@/i18n';

import promptOptions from '@/providers/prompt-options';
import { getMusicQueueRenderer } from './parser/song';

import settingHTML from './templates/setting.html?raw';

import style from './style.css?inline';

import type { YoutubePlayer } from '@/types/youtube-player';
import type { RendererContext } from '@/types/contexts';
import { createSettingPopup } from '@/plugins/music-together/ui/setting';
import { createHostPopup } from '@/plugins/music-together/ui/host';
import { createGuestPopup } from '@/plugins/music-together/ui/guest';

type StoreState = any;
type Store = {
  dispatch: (obj: {
    type: string;
    payload?: unknown;
  }) => void;

  getState: () => StoreState;
  replaceReducer: (param1: unknown) => unknown;
  subscribe: (callback: () => void) => unknown;
};

type QueueAPI = {
  dispatch(obj: {
    type: string;
    payload?: unknown;
  }): void;
  getItems(): unknown[];
  store: Store;
};

type AppAPI = {
  _queue: QueueAPI;
  _playerApi: YoutubePlayer;
  openToast: (message: string) => void;

  // TODO: Add more
};

export default createPlugin({
  name: () => t('plugins.music-together.name'),
  description: () => t('plugins.music-together.description'),
  restartNeeded: false,
  config: {
    enabled: true
  },
  stylesheets: [style],
  backend: {
    async start({ ipc, window }) {
      ipc.handle('music-together:prompt', async (title: string, label: string) => {
        const result = await prompt({
          title,
          label,
          type: 'input',
          ...promptOptions()
        });

        return result;
      });
    }
  },
  renderer: {
    peer: null as Peer | null,
    realConnection: null as DataConnection | null,
    ipc: null as RendererContext<never>['ipc'] | null,
    id: null as string | null,

    api: null as (HTMLElement & AppAPI) | null,
    queue: null as (HTMLElement & QueueAPI) | null,
    showPrompt: (async () => null) as ((title: string, label: string) => Promise<string | null>),

    elements: {} as {
      setting: HTMLElement;
      icon: SVGElement;
      spinner: HTMLElement;
    },
    replaceObserver: null as MutationObserver | null,
    isHost: false,

    /* connection */

    async onStart() {
      return new Promise<string>((resolve, reject) => {
        this.isHost = true;
        this.peer = new Peer({ debug: 3 });
        this.peer.on('open', (id) => {
          this.id = id;
          resolve(id);
        });
        this.peer.on('connection', (conn) => this.connection(conn));
        this.peer.on('error', (err) => reject(err));
      });
    },

    async connection(conn: DataConnection) {
      return new Promise<void>((resolve) => {
        this.realConnection = conn;

        conn.on('open', () => {
          resolve();

          conn.on('data', (data) => {
            try { // for test
              data = JSON.parse(data);
              console.log('for dev', data);
            } catch {
            }
            if (!data || typeof data !== 'object' || !('type' in data) || !('payload' in data) || !data.type || !data.payload) {
              console.warn('Music Together: Invalid data', data);
              return;
            }

            switch (data.type) {
              case 'ADD_SONG': {
                const videoID = (data.payload as Record<string, unknown>).videoID;
                if (typeof videoID !== 'string') return;

                this.onAddSong(videoID);
                break;
              }
              case 'REMOVE_SONG': {
                const index = (data.payload as Record<string, unknown>).index;
                if (typeof index !== 'number') return;

                this.onRemoveSong(index);
                break;
              }
              case 'SYNC_QUEUE': {
                const videoIDs = (data.payload as Record<string, unknown>).videoIDs;
                if (!Array.isArray(videoIDs)) return;

                this.syncQueue(videoIDs);
                break;
              }
              default: {
                console.warn('Music Together: Unknown Event', data);
                break;
              }
            }
          });
          conn.on('close', () => {
            this.realConnection = null;
            console.log('data-close');
          });
        });
      });
    },

    async onJoin() {
      const id = await this.showPrompt('Music Together', 'Enter host id');
      if (typeof id !== 'string') return false;

      await this.onStart();
      await this.connection(this.peer.connect(id));
      this.isHost = false;

      return true;
    },

    onStop() {
      this.peer?.destroy();
      this.peer = null;
      this.realConnection = null;
      this.isHost = false;
      this.id = null;
    },

    send(type: string, payload?: unknown) {
      if (!this.peer) return false;

      this.realConnection?.send({
        type,
        payload
      });
      return !!this.realConnection;
    },

    /* methods */

    syncQueue(videoIDs: string[] = []) {
      this.queue?.dispatch({
        type: 'UPDATE_ITEMS',
        payload: {
          items: videoIDs, // TODO: replace with real items
          nextQueueItemId: this.queue.store.getState().queue.nextQueueItemId,
          shouldAssignIds: false,
          currentIndex: 0
        }
      });
    },

    async onAddSong(videoID: string) {
      const response = await getMusicQueueRenderer([videoID]);
      if (!response) return false;

      const item = response.queueDatas[0]?.content;
      if (!item) return false;

      this.queue?.dispatch({
        type: 'ADD_ITEMS',
        payload: {
          nextQueueItemId: this.queue.store.getState().queue.nextQueueItemId,
          index: this.queue.store.getState().queue.items.length ?? 0,
          items: [item],
          shuffleEnabled: false,
          shouldAssignIds: true
        }
      });

      return true;
    },

    async onRemoveSong(index: number) {
      this.queue?.dispatch({
        type: 'REMOVE_ITEM',
        payload: index
      });
    },

    /* utils */

    get isOpen(): boolean {
      return !!this.id;
    },

    get isConnected(): boolean {
      return !!this.realConnection;
    },

    get state(): 'not-connected' | 'host' | 'guest' {
      if (this.isOpen) {
        if (this.isHost) return 'host';
        return 'guest';
      }

      return 'not-connected';
    },

    showSpinner() {
      this.elements.icon.style.setProperty('display', 'none');
      this.elements.spinner.removeAttribute('hidden');
      this.elements.spinner.setAttribute('active', '');
    },

    hideSpinner() {
      this.elements.icon.style.removeProperty('display');
      this.elements.spinner.removeAttribute('active');
      this.elements.spinner.setAttribute('hidden', '');
    },

    /* hooks */

    start({ ipc }) {
      this.ipc = ipc;
      this.showPrompt = async (title: string, label: string) => ipc.invoke('music-together:prompt', title, label);
      this.api = document.querySelector<HTMLElement & AppAPI>('ytmusic-app');

      document.querySelector('#right-content > ytmusic-settings-button')?.insertAdjacentHTML('beforebegin', settingHTML);
      const setting = document.querySelector<HTMLElement>('#music-together-setting-button');
      const icon = document.querySelector<SVGElement>('#music-together-setting-button > svg');
      const spinner = document.querySelector<HTMLElement>('#music-together-setting-button > tp-yt-paper-spinner-lite');
      if (!setting || !icon || !spinner) {
        console.warn('Music Together: Cannot inject html');
        console.log(setting, icon, spinner);
        return;
      }

      this.elements = {
        setting,
        icon,
        spinner
      };
      const availableTags = [
        'ytmusic-toggle-menu-service-item-renderer',
        'ytmusic-menu-navigation-item-renderer',
        'ytmusic-menu-service-item-renderer'
      ];
      const addSongIcons = [
        'ADD_TO_REMOTE_QUEUE',
        'QUEUE_PLAY_NEXT'
      ];
      const removeSongIcon = [
        'REMOVE'
      ];

      this.replaceObserver = new MutationObserver((entries) => {
        if (!this.isConnected) return;

        for (const entry of entries) {
          entry.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            if (!availableTags.includes(node.tagName.toLowerCase())) return;
            if (!('data' in node)) return;

            const iconType = (node.data as Record<string, Record<string, string>>)?.icon?.iconType;
            if (addSongIcons.includes(iconType)) {
              node.addEventListener('click', (event) => {
                event.stopImmediatePropagation();

                const videoId = (node.data as any)?.serviceEndpoint?.queueAddEndpoint?.queueTarget?.videoId;
                if (!videoId) {
                  this.api?.openToast('Failed to add song to Music Together');
                  return;
                }

                this.send('ADD_SONG', { videoID: videoId });
                this.onAddSong(videoId);
              }, true);
            }

            if (removeSongIcon.includes(iconType)) {
              node.addEventListener('click', (event) => {
                event.stopImmediatePropagation();

                const videoId = (node.data as any)?.serviceEndpoint?.removeFromQueueEndpoint?.videoId;
                const itemIndex = Number((node.data as any)?.serviceEndpoint?.removeFromQueueEndpoint?.itemId?.toString());

                if (!videoId) {
                  this.api?.openToast('Failed to remove song to Music Together');
                  return;
                }

                const index = Number.isFinite(itemIndex) ? itemIndex : -1;
                if (index >= 0) {
                  this.send('REMOVE_SONG', { index });
                  this.onRemoveSong(index);
                } else {
                  console.warn('Music Together: Cannot find song index');
                }
              }, true);
            }
          });
        }
      });
      this.replaceObserver.observe(document.querySelector('ytmusic-popup-container')!, {
        childList: true,
        subtree: true
      });

      const hostPopup = createHostPopup({
        onItemClick: (id) => {
          if (id === 'music-together-close') {
            this.onStop();
            this.api?.openToast('Music Together Host Closed');
            hostPopup.dismiss();
          }

          if (id === 'music-together-copy-id') {
            navigator.clipboard.writeText(this.peer?.id ?? '');

            this.api?.openToast('Copied Music Together ID to clipboard');
            hostPopup.dismiss();
          }
        }
      });
      const guestPopup = createGuestPopup({
        onItemClick: (id) => {
          if (id === 'music-together-disconnect') {
            this.onStop();
            this.api?.openToast('Music Together Disconnected');
            guestPopup.dismiss();
          }
        }
      });
      const settingPopup = createSettingPopup({
        onItemClick: async (id) => {
          if (id === 'music-together-host') {
            settingPopup.dismiss();
            this.showSpinner();
            const result = await this.onStart().catch(() => null);
            this.hideSpinner();

            if (result) {
              navigator.clipboard.writeText(this.peer?.id ?? '');
              this.api?.openToast('Copied Music Together ID to clipboard');
              hostPopup.showAtAnchor(setting);
            } else {
              this.api?.openToast('Failed to start Music Together Host');
            }
          }

          if (id === 'music-together-join') {
            settingPopup.dismiss();
            this.showSpinner();
            const result = await this.onJoin().catch(() => false);
            this.hideSpinner();

            if (result) {
              this.api?.openToast('Joined Music Together');
              guestPopup.showAtAnchor(setting);
            } else {
              this.api?.openToast('Failed to join Music Together');
            }
          }
        }
      });
      setting.addEventListener('click', async () => {
        let popup = settingPopup;
        if (this.state === 'host') popup = hostPopup;
        if (this.state === 'guest') popup = guestPopup;

        if (popup.isShowing()) popup.dismiss();
        else popup.showAtAnchor(setting);
      });
    },
    onPlayerApiReady() {
      this.queue = document.querySelector('#queue');
    },
    stop() {
      const dividers = Array.from(document.querySelectorAll('.music-together-divider'));
      dividers.forEach((divider) => divider.remove());

      this.elements.setting.remove();
      this.replaceObserver?.disconnect();
    }
  }
});
