import { DataConnection, Peer } from 'peerjs';
import prompt from 'custom-electron-prompt';

import { createPlugin } from '@/utils';
import { t } from '@/i18n';

import promptOptions from '@/providers/prompt-options';
import { ElementFromHtml } from '@/plugins/utils/renderer';
import { Popup } from './element';

import settingHTML from './templates/setting.html?raw';
import IconKey from './icons/key.svg?raw';
import IconOff from './icons/off.svg?raw';
import style from './style.css?inline';
import { YoutubePlayer } from '@/types/youtube-player';

type QueueAPI = {
  dispatch(obj: {
    type: string;
    payload?: unknown;
  }): void;
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
    start({ ipc }) {
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

    api: null as (HTMLElement & AppAPI) | null,
    queue: null as (HTMLElement & QueueAPI) | null,
    showPrompt: (async () => null) as ((title: string, label: string) => Promise<string | null>),

    elements: {} as {
      setting: HTMLElement;
      toolbar: HTMLElement;
      hostButton: HTMLElement;
      joinButton: HTMLElement;
      hostSpinner: HTMLElement;
      joinSpinner: HTMLElement;
    },

    resetQueue() {
      this.queue?.dispatch({
        type: 'CLEAR'
      });
    },

    async connection(conn: DataConnection) {
      return new Promise<void>((resolve) => {
        this.realConnection = conn;

        conn.on('open', () => {
          conn.on('data', (data) => console.log('data-received', data));
          conn.on('close', () => console.log('data-close'));
          resolve();
        });
      });
    },

    async onStart() {
      return new Promise((resolve) => {
        this.peer = new Peer({ debug: 3 });
        this.peer.on('open', (id) => resolve(id));
        this.peer.on('connection', (conn) => this.connection(conn));
      });
    },

    onStop() {
      this.peer?.destroy();
      this.peer = null;
    },

    async onJoin() {
      const id = await this.showPrompt('Music Together', 'Enter host id');
      if (typeof id !== 'string') return false;

      await this.onStart();
      await this.connection(this.peer.connect(id));

      return true;
    },

    send(type: string, payload?: unknown) {
      if (!this.peer) return false;

      this.realConnection?.send({
        type,
        payload
      });
      return !!this.realConnection;
    },

    start({ ipc }) {
      this.showPrompt = async (title: string, label: string) => ipc.invoke('music-together:prompt', title, label);
      this.api = document.querySelector<HTMLElement & AppAPI>('ytmusic-app');

      document.querySelector('#right-content > ytmusic-settings-button')?.insertAdjacentHTML('beforebegin', settingHTML);
      const setting = document.querySelector<HTMLElement>('#music-together-setting-button');
      const toolbar = document.querySelector<HTMLElement>('#music-together-setting-tool');
      const hostButton = toolbar?.querySelector<HTMLElement>('#music-together-host-button');
      const joinButton = toolbar?.querySelector<HTMLElement>('#music-together-join-button');
      const hostSpinner = document.querySelector<HTMLElement>('#music-together-host-spinner');
      const joinSpinner = document.querySelector<HTMLElement>('#music-together-join-spinner');
      if (!setting || !toolbar || !hostButton || !joinButton || !hostSpinner || !joinSpinner) {
        console.warn('Music Together: Cannot inject html');
        console.log(setting, toolbar, hostButton, joinButton, hostSpinner, joinSpinner);
        return;
      }

      this.elements = {
        setting,
        toolbar,
        hostButton,
        joinButton,
        hostSpinner,
        joinSpinner
      }

      setting.addEventListener('click', () => {
        toolbar.classList.toggle('open');
      });

      const hostIdPopup = Popup({
        data: [
          {
            icon: ElementFromHtml(IconKey),
            text: 'Click to Copy ID',
            onClick: () => {
              navigator.clipboard.writeText(this.peer?.id ?? '');

              this.api?.openToast('Copied Music Together ID to clipboard');
              hostIdPopup.dismiss();
            }
          },
          {
            icon: ElementFromHtml(IconOff),
            text: 'Close Music Together',
            onClick: () => {
              this.onStop();
              this.api?.openToast('Music Together Host Closed');
              hostIdPopup.dismiss();
            },
          },
        ],
        anchorAt: 'bottom-right',
        popupAt: 'top-right',
      });
      hostButton.addEventListener('click', async () => {
        if (this.peer?.open) {
          if (hostIdPopup.isShowing()) hostIdPopup.dismiss();
          else hostIdPopup.showAtAnchor(hostButton);
          return;
        }
        hostSpinner.removeAttribute('hidden');
        hostSpinner.setAttribute('active', '');
        hostButton.setAttribute('hidden', '');
        await this.onStart();
        hostSpinner.removeAttribute('active');
        hostSpinner.setAttribute('hidden', '');
        hostButton.removeAttribute('hidden');

        navigator.clipboard.writeText(this.peer?.id ?? '');
        this.api?.openToast('Copied Music Together ID to clipboard');
      });
      joinButton.addEventListener('click', async () => {
        joinSpinner.removeAttribute('hidden');
        joinSpinner.setAttribute('active', '');
        joinButton.setAttribute('hidden', '');
        await this.onJoin();
        joinSpinner.removeAttribute('active');
        joinSpinner.setAttribute('hidden', '');
        joinButton.removeAttribute('hidden');
      });
    },
    onPlayerApiReady() {
      this.queue = document.querySelector('#queue');
    },
    stop() {
      const dividers = Array.from(document.querySelectorAll('.music-together-divider'));
      dividers.forEach((divider) => divider.remove());

      this.elements.setting.remove();
      this.elements.toolbar.remove();
    },
  },
});
