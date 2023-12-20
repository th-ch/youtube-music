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
import { VideoDataChanged } from '@/types/video-data-changed';

type RawAccountData = {
  accountName: {
    runs: { text: string }[];
  };
  accountPhoto: {
    thumbnails: { url: string; width: number; height: number; }[];
  };
  settingsEndpoint: unknown;
  manageAccountTitle: unknown;
  trackingParams: string;
  channelHandle: {
    runs: { text: string }[];
  };
};
type Profile = {
  id: string;
  name: string;
  thumbnail?: string;
};

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
  queue_: QueueAPI;
  playerApi_: YoutubePlayer;
  openToast: (message: string) => void;

  // TODO: Add more
};

const getDefaultProfile = (connectionID: string) => ({
  id: `#music-together:${connectionID}`,
  name: `Guest ${connectionID.slice(0, 4)}`
});

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
    playerApi: null as YoutubePlayer | null,
    queue: null as (HTMLElement & QueueAPI) | null,
    showPrompt: (async () => null) as ((title: string, label: string) => Promise<string | null>),

    elements: {} as {
      setting: HTMLElement;
      icon: SVGElement;
      spinner: HTMLElement;
    },
    popups: {} as {
      host: ReturnType<typeof createHostPopup>;
      guest: ReturnType<typeof createGuestPopup>;
      setting: ReturnType<typeof createSettingPopup>;
    },
    replaceObserver: null as MutationObserver | null,
    isHost: false,
    me: null as Profile | null,
    profiles: {} as Record<string, Profile>,
    stateInterval: null as number | null,

    /* events */
    videoChangeListener(event: CustomEvent<VideoDataChanged>) {
      if (!this.isConnected || !this.isHost) return;

      if (event.detail.name === 'dataloaded') {
        const videoIdList = this.mapQueueItem((it) => it?.videoId).filter(Boolean);

        this.send('SYNC_QUEUE', { videoIDs: videoIdList });
      }
    },

    /* connection */

    async onStart() {
      return new Promise<string>((resolve, reject) => {
        this.isHost = true;
        this.peer = new Peer({ debug: 3 });
        this.peer.on('open', (id) => {
          this.id = id;
          resolve(id);
        });
        this.peer.on('connection', (conn) => {
          this.connection(conn);
          if (this.id && !this.profiles[this.id]) this.putProfile(this.id, this.me);
        });
        this.peer.on('error', (err) => reject(err));
      });
    },

    async connection(conn: DataConnection) {
      return new Promise<void>((resolve) => {
        this.realConnection = conn;
        if (!this.me) this.me = getDefaultProfile(conn.connectionId);

        conn.on('open', () => {
          resolve();

          conn.on('data', (data) => {
            if (!data || typeof data !== 'object' || !('type' in data) || !('payload' in data) || !data.type) {
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
              case 'IDENTIFY': {
                const profile = data.payload as Profile | undefined;

                this.putProfile(conn.connectionId, profile);
                break;
              }
              case 'SYNC_QUEUE': {
                if (this.isHost) {
                  const videoIdList = this.mapQueueItem((it) => it?.videoId).filter(Boolean);

                  this.send('SYNC_QUEUE', { videoIDs: videoIdList });
                } else {
                  const videoIDs = (data.payload as Record<string, unknown>).videoIDs;
                  if (!Array.isArray(videoIDs)) return;

                  this.syncQueue(videoIDs);
                }
                break;
              }
              case 'SYNC_PROFILE': {
                if (this.isHost) { // distributes
                  this.send('SYNC_PROFILE', this.profiles);
                } else {
                  const profiles = data.payload as Record<string, Profile> | undefined;
                  if (!profiles) return;

                  Object.entries(profiles).forEach(([id, profile]) => {
                    this.putProfile(id, profile);
                  });
                }
                break;
              }
              case 'SYNC_PROGRESS': {
                const payload = data.payload as Record<string, unknown> | undefined;

                if (typeof payload?.progress === 'number') {
                  const currentTime = this.playerApi?.getCurrentTime() ?? 0;
                  if (Math.abs(payload.progress - currentTime) > 3) this.playerApi?.seekTo(payload.progress);
                }
                if (this.playerApi?.getPlayerState() !== payload?.state) {
                  if (payload?.state === 2) this.playerApi?.pauseVideo();
                  if (payload?.state === 1) this.playerApi?.playVideo();
                }
                if (typeof payload?.index === 'number') {
                  const nowIndex = this.mapQueueItem((item) => item?.selected).findIndex(Boolean) ?? 0;

                  if (nowIndex !== payload.index) {
                    this.queue?.dispatch({
                      type: 'SET_INDEX',
                      payload: payload.index
                    });
                  }
                }
                break;
              }
              default: {
                console.warn('Music Together: Unknown Event', data);
                break;
              }
            }
          });

          const onClose = () => {
            this.realConnection = null;
            delete this.profiles[conn.connectionId];
            console.log('Closed', conn.connectionId);
          };
          conn.on('error', onClose);
          conn.on('close', onClose);
        });
      });
    },

    async onJoin() {
      const id = await this.showPrompt(t('plugins.music-together.name'), t('plugins.music-together.dialog.enter-host'));
      if (typeof id !== 'string') return false;

      await this.onStart();
      this.isHost = false;
      await this.connection(this.peer.connect(id));
      this.isHost = false;

      this.send('IDENTIFY', this.me);
      this.send('SYNC_PROFILE', undefined);
      this.send('SYNC_QUEUE', undefined);

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

    async syncQueue(videoIDs: string[]) {
      const response = await getMusicQueueRenderer(videoIDs);
      if (!response) return false;

      const items = response.queueDatas.map((it) => it.content);
      const currentIndex = this.mapQueueItem((it) => it?.selected).findIndex(Boolean) ?? 0;

      this.queue?.dispatch({
        type: 'UPDATE_ITEMS',
        payload: {
          items: items,
          nextQueueItemId: this.queue.store.getState().queue.nextQueueItemId,
          shouldAssignIds: true,
          currentIndex,
        }
      });
      setTimeout(() => {
        this.playerApi?.nextVideo();
        this.onRemoveSong(0);
      }, 500);

      return true;
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

    putProfile(id: string, profile?: Profile) {
      if (profile === undefined) {
        delete this.profiles[id];
        return;
      }

      this.profiles[id] = profile;
      this.popups.host.setUsers(Object.values(this.profiles));
      this.popups.guest.setUsers(Object.values(this.profiles));
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

    mapQueueItem<T>(map: (item: any | null) => T): T[] {
      return this.queue?.store.getState().queue.items
        .map((item) => {
          if ('playlistPanelVideoWrapperRenderer' in item) {
            const keys = Object.keys(item.playlistPanelVideoWrapperRenderer.primaryRenderer);
            return item.playlistPanelVideoWrapperRenderer.primaryRenderer[keys[0]];
          }
          if ('playlistPanelVideoRenderer' in item) {
            return item.playlistPanelVideoRenderer;
          }

          console.log('what?', item);
          return null;
        })
        .map(map);
    },

    /* hooks */

    start({ ipc }) {
      this.ipc = ipc;
      this.showPrompt = async (title: string, label: string) => ipc.invoke('music-together:prompt', title, label);
      this.api = document.querySelector<HTMLElement & AppAPI>('ytmusic-app');

      /* setup */
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

      /* Injector */
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
                  this.api?.openToast(t('plugins.music-together.toast.failed-to-add-song'));
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
                  this.api?.openToast(t('plugins.music-together.toast.failed-to-remove-song'));
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

      this.stateInterval = window.setInterval(() => {
        if (this.isConnected && this.isHost && this.playerApi) {
          const index = this.mapQueueItem((it) => it?.selected).findIndex(Boolean) ?? 0;

          this.send('SYNC_PROGRESS', {
            progress: this.playerApi.getCurrentTime(),
            state: this.playerApi.getPlayerState(),
            index
          });
        }
      }, 1000);

      /* UI */
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
      this.popups = {
        host: hostPopup,
        guest: guestPopup,
        setting: settingPopup
      };
      setting.addEventListener('click', async () => {
        let popup = settingPopup;
        if (this.state === 'host') popup = hostPopup;
        if (this.state === 'guest') popup = guestPopup;

        if (popup.isShowing()) popup.dismiss();
        else popup.showAtAnchor(setting);
      });

      /* account data getter */
      const accountButton = document.querySelector<HTMLElement & {
        onButtonTap: () => void
      }>('ytmusic-settings-button');

      accountButton?.onButtonTap();
      setTimeout(() => {
        accountButton?.onButtonTap();
        const renderer = document.querySelector<HTMLElement & { data: unknown }>('ytd-active-account-header-renderer');
        if (!accountButton || !renderer) {
          console.warn('Music Together: Cannot find account');
          return;
        }

        const accountData = renderer.data as RawAccountData;
        this.me = {
          id: accountData.channelHandle.runs[0].text,
          name: accountData.accountName.runs[0].text,
          thumbnail: accountData.accountPhoto.thumbnails[0].url
        };
      }, 0);
    },
    onPlayerApiReady(playerApi) {
      this.queue = document.querySelector('#queue');
      this.playerApi = playerApi;

      document.addEventListener('videodatachange', this.videoChangeListener);
    },
    stop() {
      const dividers = Array.from(document.querySelectorAll('.music-together-divider'));
      dividers.forEach((divider) => divider.remove());

      this.elements.setting.remove();
      this.replaceObserver?.disconnect();
      if (typeof this.stateInterval === 'number') clearInterval(this.stateInterval);
      if (this.videoChangeListener) document.removeEventListener('videodatachange', this.videoChangeListener);
    }
  }
});
