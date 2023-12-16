import { createPlugin } from '@/utils';
import { t } from '@/i18n';

import { DataConnection, Peer } from 'peerjs';

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
  renderer: {
    peer: null as Peer | null,
    connection: null as DataConnection | null,

    queue: null as (HTMLElement & QueueAPI) | null,
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

    onJoin() {
      const id = prompt('Enter host id');
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
        data: ping,
      });
      return !!this.connection;
    },

    start() {
      document.querySelector('#right-content')?.insertAdjacentHTML('beforeend', `
        <div class="button-group">
          <button id="music-together-host">Host</button>
          <button id="music-together-join">Join</button>
          <button id="music-together-ping">Ping!</button>
        </div>
      `);

      document.querySelector('#music-together-host')?.addEventListener('click', () => {
        this.onStart();
      });
      document.querySelector('#music-together-join')?.addEventListener('click', () => {
        this.onJoin();
      });
      document.querySelector('#music-together-ping')?.addEventListener('click', () => {
        const data = prompt('write test data');
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
