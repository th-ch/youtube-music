import {
  type DataConnection,
  Peer,
  type PeerError,
  PeerErrorType,
} from 'peerjs';
import delay from 'delay';

import type { Permission, Profile, VideoData } from './types';

export type ConnectionEventMap = {
  ADD_SONGS: { videoList: VideoData[]; index?: number };
  REMOVE_SONG: { index: number };
  MOVE_SONG: { fromIndex: number; toIndex: number };
  IDENTIFY: { profile: Profile } | undefined;
  SYNC_PROFILE: { profiles: Record<string, Profile> } | undefined;
  SYNC_QUEUE: { videoList: VideoData[] } | undefined;
  SYNC_PROGRESS:
    | { progress?: number; state?: number; index?: number }
    | undefined;
  PERMISSION: Permission | undefined;
  CONNECTION_CLOSED: null;
};
export type ConnectionEventUnion = {
  [Event in keyof ConnectionEventMap]: {
    type: Event;
    payload: ConnectionEventMap[Event];
    after?: ConnectionEventUnion[];
  };
}[keyof ConnectionEventMap];

type PromiseUtil<T> = {
  promise: Promise<T>;
  resolve: (id: T) => void;
  reject: (err: unknown) => void;
};

export type ConnectionListener = (
  event: ConnectionEventUnion,
  conn: DataConnection | null,
) => void;
export type ConnectionMode = 'host' | 'guest' | 'disconnected';
export class Connection {
  private peer: Peer;
  private _mode: ConnectionMode = 'disconnected';
  private connections: Record<string, DataConnection> = {};

  /**
   * Flag to prevent automatic reconnection when the user intentionally disconnects.
   */
  private isManualDisconnect = false;
  /**
   * Flag to prevent multiple reconnection loops from running simultaneously.
   */
  private isReconnecting = false;

  private waitOpen: PromiseUtil<string> = {} as PromiseUtil<string>;
  private listeners: ConnectionListener[] = [];
  private connectionListeners: ((connection?: DataConnection) => void)[] = [];

  constructor() {
    this.peer = new Peer({
      debug: 0,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: [
              'turn:eu-0.turn.peerjs.com:3478',
              'turn:us-0.turn.peerjs.com:3478',
            ],
            username: 'peerjs',
            credential: 'peerjsp',
          },
          {
            urls: 'stun:freestun.net:3478',
          },
          {
            urls: 'turn:freestun.net:3478',
            username: 'free',
            credential: 'free',
          },
        ],
        sdpSemantics: 'unified-plan',
      },
    });

    this.waitOpen.promise = new Promise<string>((resolve, reject) => {
      this.waitOpen.resolve = resolve;
      this.waitOpen.reject = reject;
    });

    const reconnectLoop = async (err?: PeerError<`${PeerErrorType}`>) => {
      if (this.isManualDisconnect || this.isReconnecting) return;
      this.isReconnecting = true;

      if (err)
        console.warn(
          'Music Together: PeerJS event triggered reconnection.',
          err,
        );

      if (!this.peer.disconnected) {
        this.peer.disconnect();
      }

      while (!this.peer.destroyed) {
        if (this.isManualDisconnect) break;

        try {
          if (!this.peer.disconnected) {
            await delay(1000);
            continue;
          }

          console.log(
            'Music Together: Attempting to reconnect to PeerJS server...',
          );
          this.peer.reconnect();
          break;
        } catch (reconnectErr) {
          console.error(
            'Music Together: Reconnect attempt failed. Retrying in 10 seconds.',
            reconnectErr,
          );
          // Wait before the next reconnection attempt
          await delay(10000);
        }
      }
      this.isReconnecting = false;
    };

    this.peer.on('open', (id) => {
      this._mode = 'host';
      this.isReconnecting = false;
      this.waitOpen.resolve(id);
      console.log('Music Together: PeerJS connection opened with ID:', id);
    });

    this.peer.on('connection', async (conn) => {
      this._mode = 'host';
      await this.registerConnection(conn);
    });

    this.peer.on('disconnected', () => {
      if (this.isManualDisconnect) return;
      console.warn(
        'Music Together: Disconnected from PeerJS server. The library will attempt to reconnect automatically.',
      );
    });

    this.peer.on('close', () => reconnectLoop());

    this.peer.on('error', (err) => {
      // Only attempt to reconnect on recoverable network errors
      if (
        !this.isManualDisconnect &&
        (err.type === PeerErrorType.Network ||
          err.type === PeerErrorType.PeerUnavailable ||
          err.type === PeerErrorType.ServerError)
      ) {
        reconnectLoop(err);
      } else {
        console.error('Music Together: Unrecoverable PeerJS Error:', err);
        this.waitOpen.reject(err);
        this.connectionListeners.forEach((listener) => listener());
        this.disconnect();
      }
    });
  }

  /* public */
  async waitForReady() {
    return this.waitOpen.promise;
  }

  async connect(id: string) {
    this._mode = 'guest';
    const conn = this.peer.connect(id, {
      reliable: true,
    });
    await this.registerConnection(conn);
    return conn;
  }

  disconnect() {
    if (this._mode === 'disconnected') throw new Error('Already disconnected');

    // Set flag to stop any reconnection attempts
    this.isManualDisconnect = true;
    this.isReconnecting = false;
    this._mode = 'disconnected';

    this.getConnections().forEach((conn) =>
      conn.close({
        flush: true,
      }),
    );
    this.connections = {};
    this.connectionListeners = [];

    for (const listener of this.listeners) {
      listener({ type: 'CONNECTION_CLOSED', payload: null }, null);
    }
    this.listeners = [];

    if (!this.peer.destroyed) {
      this.peer.destroy();
    }
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

  public async broadcast<Event extends keyof ConnectionEventMap>(
    type: Event,
    payload: ConnectionEventMap[Event],
  ) {
    await Promise.all(
      this.getConnections().map((conn) => conn.send({ type, payload })),
    );
  }

  public on(listener: ConnectionListener) {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  public onConnections(listener: (connections?: DataConnection) => void) {
    this.connectionListeners.push(listener);
  }

  /* privates */
  private async registerConnection(conn: DataConnection) {
    return new Promise<DataConnection>((resolve, reject) => {
      conn.on('open', () => {
        this.connections[conn.connectionId] = conn;
        resolve(conn);
        this.connectionListeners.forEach((listener) => listener(conn));

        conn.on('data', (data) => {
          if (
            !data ||
            typeof data !== 'object' ||
            !('type' in data) ||
            !('payload' in data) ||
            !data.type
          ) {
            console.warn('Music Together: Invalid data', data);
            return;
          }

          for (const listener of this.listeners) {
            listener(data as ConnectionEventUnion, conn);
          }
        });
      });

      const onClose = (
        err?: PeerError<
          | 'not-open-yet'
          | 'message-too-big'
          | 'negotiation-failed'
          | 'connection-closed'
        >,
      ) => {
        if (conn.open) {
          conn.close();
        }

        delete this.connections[conn.connectionId];

        if (err) {
          if (err.type === 'connection-closed') {
            this.connectionListeners.forEach((listener) => listener());
          }
          reject(err);
        } else {
          this.connectionListeners.forEach((listener) => listener(conn));
        }
      };
      conn.on('error', onClose);
      conn.on('close', onClose);
    });
  }
}
