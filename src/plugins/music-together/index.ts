import { createPlugin } from '@/utils';
import { t } from '@/i18n';

import { DataConnection, Peer } from 'peerjs';
import prompt from 'custom-electron-prompt';
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
          ...promptOptions(),
        });

        return result;
      });
    }
  },
  renderer: {
    peer: null as Peer | null,
    connection: null as DataConnection | null,

    queue: null as (HTMLElement & QueueAPI) | null,
    showPrompt: (async () => null) as ((title: string, label: string) => Promise<string | null>),

    resetQueue() {
      this.queue?.dispatch({
        type: 'CLEAR'
      });
    },

    onStart() {
      this.peer = new Peer();
      this.peer.on('connection', (conn) => {
        this.connection = conn;
        conn.on('data', (data) => {
          console.log('host-received', data);
        });

        conn.on('open', () => {
          conn.send('hello!');
        });
      });
      this.peer.on('open', function(id) {
        console.log(`My peer ID is: "${id}"`);
      });
    },

    onStop() {
      this.peer?.destroy();
      this.peer = null;
      this.connection = null;
    },

    async onJoin() {
      const id = await this.showPrompt('Music Together', 'Enter host id');
      if (typeof id !== 'string') return false;

      this.peer = new Peer();
      this.connection = this.peer.connect(id);
      this.connection.on('open', () => {
        this.connection?.send('hello!');
      });
      this.connection.on('data', (data) => {
        console.log('guest-received', data);
      });
      this.connection.on('error', (error) => {
        console.error(error);
      });

      return true;
    },

    sendPing(ping: string) {
      if (!this.peer) return false;

      this.connection?.send({
        type: 'ping',
        data: ping
      });
      return !!this.connection;
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
