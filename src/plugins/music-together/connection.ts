import { DataConnection, Peer } from 'peerjs';

import type { Permission, Profile, VideoData } from './types';

export type ConnectionEventMap = {
  ADD_SONGS: { videoList: VideoData[], index?: number };
  REMOVE_SONG: { index: number };
  MOVE_SONG: { fromIndex: number; toIndex: number };
  IDENTIFY: { profile: Profile } | undefined;
  SYNC_PROFILE: { profiles: Record<string, Profile> } | undefined;
  SYNC_QUEUE: { videoList: VideoData[] } | undefined;
  SYNC_PROGRESS: { progress?: number; state?: number; index?: number; } | undefined;
  PERMISSION: Permission | undefined;
};
export type ConnectionEventUnion = {
  [Event in keyof ConnectionEventMap]: {
    type: Event;
    payload: ConnectionEventMap[Event];
  };
}[keyof ConnectionEventMap];

type PromiseUtil<T> = {
  promise: Promise<T>;
  resolve: (id: T) => void;
  reject: (err: unknown) => void;
}

export type ConnectionListener = (event: ConnectionEventUnion, conn: DataConnection) => void;
export type ConnectionMode = 'host' | 'guest' | 'disconnected';
export class Connection {
  private peer: Peer;
  private _mode: ConnectionMode = 'disconnected';
  private connections: Record<string, DataConnection> = {};

  private waitOpen: PromiseUtil<string> = {} as PromiseUtil<string>;
  private listeners: ConnectionListener[] = [];

  constructor() {
    this.peer = new Peer();

    this.waitOpen.promise = new Promise<string>((resolve, reject) => {
      this.waitOpen.resolve = resolve;
      this.waitOpen.reject = reject;
    });

    this.peer.on('open', (id) => {
      this._mode = 'host';
      this.waitOpen.resolve(id);
    });
    this.peer.on('connection', (conn) => {
      this._mode = 'host';
      this.registerConnection(conn);
    });
    this.peer.on('error', (err) => {
      this._mode = 'disconnected';
      console.log(err);
    });
  }

  /* public */
  async waitForReady() {
    return this.waitOpen.promise;
  }

  async connect(id: string) {
    this._mode = 'guest';
    const conn = this.peer.connect(id);
    await this.registerConnection(conn);
    return conn;
  }

  async disconnect() {
    if (this._mode === 'disconnected') throw new Error('Already disconnected');

    this._mode = 'disconnected';
    this.connections = {};
    this.peer.destroy();
  }

  /* utils */
  public get id() {
    return this.peer.id;
  }

  public get mode() {
    return this._mode;
  }

  public getConnections() {
    return Object.values(this.connections);
  }

  public broadcast<Event extends keyof ConnectionEventMap>(type: Event, payload: ConnectionEventMap[Event]) {
    for (const conn of this.getConnections()) {
      conn.send({ type, payload });
    }
  }

  public on(listener: ConnectionListener) {
    this.listeners.push(listener);
  }

  /* privates */
  private async registerConnection(conn: DataConnection) {
    return new Promise<DataConnection>((resolve) => {
      conn.on('open', () => {
        this.connections[conn.connectionId] = conn;
        resolve(conn);

        conn.on('data', (data) => {
          if (!data || typeof data !== 'object' || !('type' in data) || !('payload' in data) || !data.type) {
            console.warn('Music Together: Invalid data', data);
            return;
          }

          for (const listener of this.listeners) {
            listener(data as ConnectionEventUnion, conn);
          }
        });
      });

      const onClose = () => {
        delete this.connections[conn.connectionId];
      };
      conn.on('error', onClose);
      conn.on('close', onClose);
    });
  }
}
