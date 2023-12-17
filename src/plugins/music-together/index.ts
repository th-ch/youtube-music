import { DataConnection, Peer } from 'peerjs';
import prompt from 'custom-electron-prompt';

import { createPlugin } from '@/utils';
import { t } from '@/i18n';

import promptOptions from '@/providers/prompt-options';

type QueueAPI = {
  dispatch(obj: {
    type: string;
    payload?: unknown;
  }): void;
}

export default createPlugin({
  name: () => t('plugins.music-together.name'),
  description: () => t('plugins.music-together.description'),
  restartNeeded: false,
  config: {
    enabled: true
  },
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

    queue: null as (HTMLElement & QueueAPI) | null,
    showPrompt: (async () => null) as ((title: string, label: string) => Promise<string | null>),

    resetQueue() {
      this.queue?.dispatch({
        type: 'CLEAR'
      });
    },

    connection(conn: DataConnection) {
      this.realConnection = conn;
      conn.on('open', () => {
        conn.on('data', (data) => console.log('data-received', data));
        conn.on('close', () => console.log('data-close'));
      });
    },

    async onStart() {
      return new Promise((resolve) => {
        this.peer = new Peer({ debug: 3 });
        this.peer.on('open', (id) => {
          console.log('open', id);

          resolve(id);
        });
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
      this.connection(this.peer.connect(id));

      return true;
    },

    sendPing(ping: string) {
      if (!this.peer) return false;

      console.log(ping);
      this.realConnection?.send(ping);
      return !!this.realConnection;
    },

    start({ ipc }) {
      this.showPrompt = async (title: string, label: string) => ipc.invoke('music-together:prompt', title, label);

      document.querySelector('#right-content')?.insertAdjacentHTML('beforeend', `
        <div class='button-group'>
          <button id='music-together-host'>Host</button>
          <button id='music-together-join'>Join</button>
          <button id='music-together-ping'>Ping!</button>
        </div>
      `);

      document.querySelector('#music-together-host')?.addEventListener('click', () => {
        this.onStop();
        this.onStart();
      });
      document.querySelector('#music-together-join')?.addEventListener('click', () => {
        this.onJoin();
      });
      document.querySelector('#music-together-ping')?.addEventListener('click', async () => {
        const data = await this.showPrompt('Music Together', 'write test data');
        this.sendPing(data ?? 'test');
      });

    },
    onPlayerApiReady() {
      this.queue = document.querySelector('#queue');
    },
    stop() {

    }
  }
});
