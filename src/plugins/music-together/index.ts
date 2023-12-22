import prompt from 'custom-electron-prompt';

import { t } from '@/i18n';
import { createPlugin } from '@/utils';
import promptOptions from '@/providers/prompt-options';

import { getDefaultProfile, Permission, Profile, VideoData } from './types';
import { Queue, QueueAPI } from './queue';
import { Connection, ConnectionEventUnion } from './connection';
import { createHostPopup } from './ui/host';
import { createGuestPopup } from './ui/guest';
import { createSettingPopup } from './ui/setting';

import settingHTML from './templates/setting.html?raw';
import style from './style.css?inline';

import type { YoutubePlayer } from '@/types/youtube-player';
import type { RendererContext } from '@/types/contexts';
import type { VideoDataChanged } from '@/types/video-data-changed';
import { DataConnection } from 'peerjs';

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

type AppAPI = {
  queue_: QueueAPI;
  playerApi_: YoutubePlayer;
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
    async start({ ipc }) {
      ipc.handle('music-together:prompt', async (title: string, label: string) => prompt({
        title,
        label,
        type: 'input',
        ...promptOptions()
      }));
    }
  },
  renderer: {
    connection: null as Connection | null,
    ipc: null as RendererContext<never>['ipc'] | null,

    api: null as (HTMLElement & AppAPI) | null,
    queue: null as Queue | null,
    playerApi: null as YoutubePlayer | null,
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
    stateInterval: null as number | null,
    oldPlaylistId: '',
    ignoreChange: false,

    me: null as Omit<Profile, 'id'> | null,
    profiles: {} as Record<string, Profile>,
    permission: 'host-only' as Permission,

    /* events */
    videoChangeListener(event: CustomEvent<VideoDataChanged>) {
      if (this.connection?.mode !== 'host') return;

      if (event.detail.videoData?.playlistId !== this.oldPlaylistId) {
        this.oldPlaylistId = event.detail.videoData?.playlistId ?? '';
      }

      const videoList: VideoData[] = this.queue?.flatItems.map((it: any) => ({
        videoId: it.videoId,
        owner: {
          id: this.connection!.id,
          ...this.me!
        }
      } satisfies VideoData)) ?? [];

      this.queue?.setVideoList(videoList, false);
      this.queue?.syncQueueOwner();
      this.connection.broadcast('SYNC_QUEUE', {
        videoList
      });
    },

    videoStateChangeListener() {
      if (this.connection?.mode !== 'guest') return;
      if (this.ignoreChange) return;
      if (this.permission !== 'all') return;

      const index = this.queue?.selectedIndex ?? 0;

      this.connection.broadcast('SYNC_PROGRESS', {
        progress: this.playerApi?.getCurrentTime(),
        state: this.playerApi?.getPlayerState(),
        index
      });
    },

    /* connection */
    async onHost() {
      this.connection = new Connection();
      await this.connection.waitForReady();

      if (!this.me) this.me = getDefaultProfile(this.connection.id);
      const rawItems = this.queue?.flatItems?.map((it: any) => ({
        videoId: it.videoId,
        owner: {
          id: this.connection!.id,
          ...this.me!
        }
      } satisfies VideoData)) ?? [];
      this.queue?.setOwner({
        id: this.connection.id,
        ...this.me
      });
      this.queue?.setVideoList(rawItems, false);
      this.queue?.syncQueueOwner();
      this.queue?.initQueue();
      this.queue?.injection();

      this.profiles = {};
      this.profiles[this.connection.id] = {
        id: this.connection.id,
        ...this.me
      };

      const listener = (event: ConnectionEventUnion, conn?: DataConnection) => {
        this.ignoreChange = true;

        switch (event.type) {
          case 'ADD_SONGS': {
            this.queue?.addVideos(event.payload.videoList);
            this.connection?.broadcast('ADD_SONGS', event.payload);
            break;
          }
          case 'REMOVE_SONG': {
            this.queue?.removeVideo(event.payload.index);
            this.connection?.broadcast('REMOVE_SONG', event.payload);
            break;
          }
          case 'MOVE_SONG': {
            this.queue?.moveItem(event.payload.fromIndex, event.payload.toIndex);
            this.connection?.broadcast('MOVE_SONG', event.payload);
            break;
          }
          case 'IDENTIFY': {
            if (!event.payload || !conn) {
              console.warn('Music Together [Host]: Received "IDENTIFY" event without payload or connection');
              break;
            }

            this.putProfile(conn.connectionId, event.payload.profile);
            break;
          }
          case 'SYNC_PROFILE': {
            this.connection?.broadcast('SYNC_PROFILE', { profiles: this.profiles });

            break;
          }
          case 'PERMISSION': {
            this.connection?.broadcast('PERMISSION', this.permission);
            this.popups.guest.setPermission(this.permission);
            this.popups.host.setPermission(this.permission);
            this.popups.setting.setPermission(this.permission);
            break;
          }
          case 'SYNC_QUEUE': {
            this.connection?.broadcast('SYNC_QUEUE', {
              videoList: this.queue?.videoList ?? [],
            });
            break;
          }
          case 'SYNC_PROGRESS': {
            if (this.permission !== 'all') break;

            if (typeof event.payload?.progress === 'number') {
              const currentTime = this.playerApi?.getCurrentTime() ?? 0;
              if (Math.abs(event.payload.progress - currentTime) > 3) this.playerApi?.seekTo(event.payload.progress);
            }
            if (this.playerApi?.getPlayerState() !== event.payload?.state) {
              if (event.payload?.state === 2) this.playerApi?.pauseVideo();
              if (event.payload?.state === 1) this.playerApi?.playVideo();
            }
            if (typeof event.payload?.index === 'number') {
              const nowIndex = this.queue?.selectedIndex ?? 0;

              if (nowIndex !== event.payload.index) {
                this.queue?.setIndex(event.payload.index);
              }
            }
            break;
          }
          default: {
            console.warn('Music Together [Host]: Unknown Event', event);
            break;
          }
        }
      };
      this.connection.on(listener);
      this.queue?.on(listener);

      setTimeout(() => {
        this.ignoreChange = false;
      }, 16); // wait 1 frame
      return true;
    },

    async onJoin() {
      this.connection = new Connection();
      await this.connection.waitForReady();
      this.profiles = {};

      const id = await this.showPrompt(t('plugins.music-together.name'), t('plugins.music-together.dialog.enter-host'));
      if (typeof id !== 'string') return false;

      const connection = await this.connection.connect(id).catch(() => false);

      const listener = (event: ConnectionEventUnion) => {
        this.ignoreChange = true;
        switch (event.type) {
          case 'ADD_SONGS': {
            this.queue?.addVideos(event.payload.videoList);
            break;
          }
          case 'REMOVE_SONG': {
            this.queue?.removeVideo(event.payload.index);
            break;
          }
          case 'MOVE_SONG': {
            this.queue?.moveItem(event.payload.fromIndex, event.payload.toIndex);
            break;
          }
          case 'IDENTIFY': {
            console.warn('Music Together [Guest]: Received "IDENTIFY" event from guest');
            break;
          }
          case 'SYNC_QUEUE': {
            if (Array.isArray(event.payload?.videoList)) {
              this.queue?.setVideoList(event.payload.videoList);
            }
            break;
          }
          case 'SYNC_PROFILE': {
            if (!event.payload) {
              console.warn('Music Together [Guest]: Received "SYNC_PROFILE" event without payload');
              break;
            }

            Object.entries(event.payload.profiles).forEach(([id, profile]) => {
              this.putProfile(id, profile);
            });
            break;
          }
          case 'SYNC_PROGRESS': {
            if (typeof event.payload?.progress === 'number') {
              const currentTime = this.playerApi?.getCurrentTime() ?? 0;
              if (Math.abs(event.payload.progress - currentTime) > 3) this.playerApi?.seekTo(event.payload.progress);
            }
            if (this.playerApi?.getPlayerState() !== event.payload?.state) {
              if (event.payload?.state === 2) this.playerApi?.pauseVideo();
              if (event.payload?.state === 1) this.playerApi?.playVideo();
            }
            if (typeof event.payload?.index === 'number') {
              const nowIndex = this.queue?.selectedIndex ?? 0;

              if (nowIndex !== event.payload.index) {
                this.queue?.setIndex(event.payload.index);
              }
            }
            break;
          }
          case 'PERMISSION': {
            if (!event.payload) {
              console.warn('Music Together [Guest]: Received "PERMISSION" event without payload');
              break;
            }

            this.permission = event.payload;
            this.popups.guest.setPermission(this.permission);
            this.popups.host.setPermission(this.permission);
            this.popups.setting.setPermission(this.permission);

            const permissionLabel = t(`plugins.music-together.menu.permission.${this.permission}`);

            this.api?.openToast(t('plugins.music-together.toast.permission-changed', { permission: permissionLabel }));
            break;
          }
          default: {
            console.warn('Music Together [Guest]: Unknown Event', event);
            break;
          }
        }

        setTimeout(() => {
          this.ignoreChange = false;
        }, 16); // wait 1 frame
      };

      this.connection.on(listener);
      this.queue?.on(listener);

      if (!this.me) this.me = getDefaultProfile(this.connection.id);
      this.queue?.injection();
      this.queue?.setOwner({
        id: this.connection.id,
        ...this.me
      });

      this.connection.broadcast('IDENTIFY', {
        profile: {
          id: this.connection.id,
          handleId: this.me.handleId,
          name: this.me.name,
          thumbnail: this.me.thumbnail
        },
      });

      this.connection.broadcast('SYNC_PROFILE', undefined);
      this.connection.broadcast('PERMISSION', undefined);
      this.connection.broadcast('SYNC_QUEUE', undefined);

      this.queue?.syncQueueOwner();
      this.queue?.initQueue();

      return !!connection;
    },

    onStop() {
      this.connection?.disconnect();
      this.queue?.rollbackInjection();
      this.queue?.removeQueueOwner();

      this.profiles = {};

      this.popups.host.dismiss();
      this.popups.guest.dismiss();
      this.popups.setting.dismiss();
    },

    /* methods */
    putProfile(id: string, profile?: Profile) {
      if (profile === undefined) {
        delete this.profiles[id];
        return;
      }

      this.profiles[id] = profile;
      this.popups.host.setUsers(Object.values(this.profiles));
      this.popups.guest.setUsers(Object.values(this.profiles));
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

    initMyProfile() {
      const accountButton = document.querySelector<HTMLElement & {
        onButtonTap: () => void
      }>('ytmusic-settings-button');

      accountButton?.onButtonTap();
      setTimeout(() => {
        accountButton?.onButtonTap();
        const renderer = document.querySelector<HTMLElement & { data: unknown }>('ytd-active-account-header-renderer');
        if (!accountButton || !renderer) {
          console.warn('Music Together: Cannot find account');
          this.me = getDefaultProfile(this.connection?.id ?? '');
          return;
        }

        const accountData = renderer.data as RawAccountData;
        this.me = {
          handleId: accountData.channelHandle.runs[0].text,
          name: accountData.accountName.runs[0].text,
          thumbnail: accountData.accountPhoto.thumbnails[0].url
        };

        if (this.me.thumbnail) {
          this.popups.host.setProfile(this.me.thumbnail);
          this.popups.guest.setProfile(this.me.thumbnail);
          this.popups.setting.setProfile(this.me.thumbnail);
        }
      }, 0);
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
        if (this.connection?.mode !== 'host' && this.connection?.mode !== 'guest') return;

        for (const entry of entries) {
          entry.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            if (!availableTags.includes(node.tagName.toLowerCase())) return;
            if (!('data' in node)) return;

            const iconType = (node.data as Record<string, Record<string, string>>)?.icon?.iconType;
            if (addSongIcons.includes(iconType)) {
              node.addEventListener('click', (event) => {
                event.stopImmediatePropagation();

                const videoId: string | undefined = (node.data as any)?.serviceEndpoint?.queueAddEndpoint?.queueTarget?.videoId;
                if (!videoId) {
                  this.api?.openToast(t('plugins.music-together.toast.failed-to-add-song'));
                  return;
                }

                if (!this.me) this.me = getDefaultProfile(this.connection?.id ?? '');
                const videoData: VideoData = {
                  videoId,
                  owner: {
                    id: this.connection!.id,
                    ...this.me
                  }
                };
                this.connection?.broadcast('ADD_SONGS', { videoList: [videoData] });
                if (this.connection?.mode === 'host') this.queue?.addVideos([videoData]);
              }, true);
            }

            if (removeSongIcon.includes(iconType)) {
              node.addEventListener('click', (event) => {
                event.stopImmediatePropagation();

                const videoId: string | undefined = (node.data as any)?.serviceEndpoint?.removeFromQueueEndpoint?.videoId;
                const itemIndex = Number((node.data as any)?.serviceEndpoint?.removeFromQueueEndpoint?.itemId?.toString());

                if (!videoId) {
                  this.api?.openToast(t('plugins.music-together.toast.failed-to-remove-song'));
                  return;
                }

                const index = Number.isFinite(itemIndex) ? itemIndex : -1;
                if (index >= 0) {
                  this.connection?.broadcast('REMOVE_SONG', { index });
                  if (this.connection?.mode === 'host') this.queue?.removeVideo(index);
                } else {
                  console.warn('Music Together: Cannot find song index');
                }
              }, true);
            }
          });
        }
      });
      // this.replaceObserver.observe(document.querySelector('ytmusic-popup-container')!, {
      //   childList: true,
      //   subtree: true
      // });

      this.stateInterval = window.setInterval(() => {
        if (this.connection?.mode !== 'host') return;
        const index = this.queue?.selectedIndex ?? 0;

        this.connection.broadcast('SYNC_PROGRESS', {
          progress: this.playerApi?.getCurrentTime(),
          state: this.playerApi?.getPlayerState(),
          index
        });
      }, 1000);

      /* UI */
      const hostPopup = createHostPopup({
        onItemClick: (id) => {
          if (id === 'music-together-close') {
            this.onStop();
            this.api?.openToast(t('plugins.music-together.toast.closed'));
            hostPopup.dismiss();
          }

          if (id === 'music-together-copy-id') {
            navigator.clipboard.writeText(this.connection?.id ?? '');

            this.api?.openToast(t('plugins.music-together.toast.id-copied'));
            hostPopup.dismiss();
          }

          if (id === 'music-together-permission') {
            this.permission = this.permission === 'host-only' ? 'all' : 'host-only';
            this.connection?.broadcast('PERMISSION', this.permission);

            hostPopup.setPermission(this.permission);
            guestPopup.setPermission(this.permission);
            settingPopup.setPermission(this.permission);

            const permissionLabel = t(`plugins.music-together.menu.permission.${this.permission}`);
            this.api?.openToast(t('plugins.music-together.toast.permission-changed', { permission: permissionLabel }));
            const item = hostPopup.items.find((it) => it?.element.id === id);
            if (item?.type === 'item') {
              item.setText(t('plugins.music-together.menu.set-permission', { permission: permissionLabel }));
            }
          }
        }
      });
      const guestPopup = createGuestPopup({
        onItemClick: (id) => {
          if (id === 'music-together-disconnect') {
            this.onStop();
            this.api?.openToast(t('plugins.music-together.toast.disconnected'));
            guestPopup.dismiss();
          }
        }
      });
      const settingPopup = createSettingPopup({
        onItemClick: async (id) => {
          if (id === 'music-together-host') {
            settingPopup.dismiss();
            this.showSpinner();
            const result = await this.onHost();
            this.hideSpinner();

            if (result) {
              navigator.clipboard.writeText(this.connection?.id ?? '');
              this.api?.openToast(t('plugins.music-together.toast.id-copied'));
              hostPopup.showAtAnchor(setting);
            } else {
              this.api?.openToast(t('plugins.music-together.toast.host-failed'));
            }
          }

          if (id === 'music-together-join') {
            settingPopup.dismiss();
            this.showSpinner();
            const result = await this.onJoin();
            this.hideSpinner();

            if (result) {
              this.api?.openToast(t('plugins.music-together.toast.joined'));
              guestPopup.showAtAnchor(setting);
            } else {
              this.api?.openToast(t('plugins.music-together.toast.join-failed'));
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
        if (this.connection?.mode === 'host') popup = hostPopup;
        if (this.connection?.mode === 'guest') popup = guestPopup;

        if (popup.isShowing()) popup.dismiss();
        else popup.showAtAnchor(setting);
      });

      /* account data getter */
      this.initMyProfile();
    },
    onPlayerApiReady(playerApi) {
      this.queue = new Queue({
        owner: {
          id: this.connection?.id ?? '',
          ...this.me!
        },
      });
      this.playerApi = playerApi;

      this.playerApi.addEventListener('onStateChange', this.videoStateChangeListener);
      document.addEventListener('videodatachange', this.videoChangeListener);
    },
    stop() {
      const dividers = Array.from(document.querySelectorAll('.music-together-divider'));
      dividers.forEach((divider) => divider.remove());

      this.elements.setting.remove();
      this.onStop();
      if (typeof this.stateInterval === 'number') clearInterval(this.stateInterval);
      if (this.playerApi) this.playerApi.removeEventListener('onStateChange', this.videoStateChangeListener);
      if (this.videoChangeListener) document.removeEventListener('videodatachange', this.videoChangeListener);
    }
  }
});
