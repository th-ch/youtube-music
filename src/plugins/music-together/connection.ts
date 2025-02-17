import { DataConnection, Peer } from 'peerjs';

import { ConnectedState, ConnectionEventMap, ConnectionEventUnion } from './types';

type PromiseUtil<T> = {
  promise: Promise<T>;
  resolve: (id: T) => void;
  reject: (err: unknown) => void;
};

export type ConnectionListener = (
  event: ConnectionEventUnion,
  conn: DataConnection,
) => void;

export class Connection {
  private peer: Peer;
  private _state: ConnectedState = 'disconnected';
  private connections: Record<string, DataConnection> = {};

  private waitOpen: PromiseUtil<string> = {} as PromiseUtil<string>;
  private listeners: ConnectionListener[] = [];
  private connectionListeners: ((connection?: DataConnection) => void)[] = [];

  constructor() {
    this.peer = new Peer({ debug: 0 });

    this.waitOpen.promise = new Promise<string>((resolve, reject) => {
      this.waitOpen.resolve = resolve;
      this.waitOpen.reject = reject;
    });

    this.peer.on('open', (id) => {
      this._state = 'connecting';
      this.waitOpen.resolve(id);
    });
    this.peer.on('connection', (conn) => {
      this._state = 'host';
      this.registerConnection(conn);
    });
    this.peer.on('error', (err) => {
      this._state = 'disconnected';

      this.waitOpen.reject(err);
      this.connectionListeners.forEach((listener) => listener());
      console.log(err);
    });
  }

  /* public */
  async waitForReady() {
    return this.waitOpen.promise;
  }

  async connect(id: string) {
    this._state = 'guest';
    const conn = this.peer.connect(id);
    await this.registerConnection(conn);
    return conn;
  }

  disconnect() {
    if (this._state === 'disconnected') throw new Error('Already disconnected');

    this._state = 'disconnected';
    this.connections = {};
    this.peer.destroy();
  }

  /* utils */
  public get id() {
    return this.peer.id;
  }

  public get state() {
    return this._state;
  }

  public getConnections() {
    return Object.values(this.connections);
  }

  public async broadcast<Event extends keyof ConnectionEventMap>(
    type: Event,
    payload: ConnectionEventMap[Event],
  ) {
    await Promise.all(
      this.getConnections().map((conn) => conn.send({ type, payload })),
    );
  }

  public on(listener: ConnectionListener) {
    this.listeners.push(listener);
  }

  public onConnections(listener: (connections?: DataConnection) => void) {
    this.connectionListeners.push(listener);
  }

  /* privates */
  private async registerConnection(conn: DataConnection) {
    return new Promise<DataConnection>((resolve, reject) => {
      this.peer.once('error', (err) => {
        this._state = 'disconnected';

        reject(err);
        this.connectionListeners.forEach((listener) => listener());
      });

      conn.on('open', () => {
        this.connections[conn.connectionId] = conn;
        resolve(conn);
        this.connectionListeners.forEach((listener) => listener(conn));

        conn.on('data', (data) => {
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data);
            } catch {}
          }

          if (
            !data ||
            typeof data !== 'object' ||
            !('type' in data) ||
            !('payload' in data) ||
            !data.type
          ) {
            console.warn('Music Together: Invalid data', data, typeof data);
            return;
          }

          for (const listener of this.listeners) {
            listener(data as ConnectionEventUnion, conn);
          }
        });
      });

      const onClose = (err?: Error) => {
        if (err) reject(err);

        delete this.connections[conn.connectionId];
        this.connectionListeners.forEach((listener) => listener(conn));
      };
      conn.on('error', onClose);
      conn.on('close', onClose);
    });
  }
}
