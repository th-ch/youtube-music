import { getMusicQueueRenderer } from './song';
import { mapQueueItem } from './utils';

import type { Profile, VideoData } from '../types';
import { ConnectionEventUnion } from '@/plugins/music-together/connection';

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
export type QueueAPI = {
  dispatch(obj: {
    type: string;
    payload?: unknown;
  }): void;
  getItems(): unknown[];
  store: Store;
  continuation?: string;
  autoPlaying?: boolean;
};
export type QueueOptions = {
  videoList?: VideoData[];
  owner?: Profile;
}
export type QueueEventListener = (event: ConnectionEventUnion) => void;

export class Queue {
  private queue: (HTMLElement & QueueAPI) | null = null;
  private originalDispatch: ((obj: {
    type: string;
    payload?: unknown;
  }) => void) | null = null;
  private internalDispatch = 0;
  private listeners: QueueEventListener[] = [];
  private owner: Profile | null = null;

  constructor(
    options: QueueOptions = {},
    element = document.querySelector<HTMLElement & QueueAPI>('#queue')
  ) {
    this.queue = element;
    this.owner = options.owner ?? null;
    this._videoList = options.videoList ?? [];
  }

  private _videoList: VideoData[] = [];

  /* utils */
  get videoList() {
    return this._videoList;
  }

  get selectedIndex() {
    return mapQueueItem((it) => it?.selected, this.queue?.store.getState().queue.items).findIndex(Boolean) ?? 0;
  }

  get rawItems() {
    return this.queue?.store.getState().queue.items;
  }

  get flatItems() {
    return mapQueueItem((it) => it, this.rawItems);
  }

  setOwner(owner: Profile) {
    this.owner = owner;
  }

  /* public */
  async setVideoList(videoList: VideoData[], sync = true) {
    this._videoList = videoList;

    if (sync) await this.syncVideo();
  }

  async addVideos(videos: VideoData[], index?: number) {
    const response = await getMusicQueueRenderer(videos.map((it) => it.videoId));
    if (!response) return false;

    const item = response.queueDatas[0]?.content;
    if (!item) return false;

    this.internalDispatch = Number.POSITIVE_INFINITY;
    this._videoList.push(...videos);
    this.queue?.dispatch({
      type: 'ADD_ITEMS',
      payload: {
        nextQueueItemId: this.queue.store.getState().queue.nextQueueItemId,
        index: index ?? this.queue.store.getState().queue.items.length ?? 0,
        items: [item],
        shuffleEnabled: false,
        shouldAssignIds: true
      }
    });
    this.internalDispatch = 0;
    setTimeout(() => {
      this.initQueue();
      this.syncQueueOwner();
    }, 0);

    return true;
  }

  async removeVideo(index: number) {
    this.internalDispatch = Number.POSITIVE_INFINITY;
    this._videoList.splice(index, 1);
    this.queue?.dispatch({
      type: 'REMOVE_ITEM',
      payload: index
    });
    this.internalDispatch = 0;
    setTimeout(() => {
      this.initQueue();
      this.syncQueueOwner();
    }, 0);
  }

  setIndex(index: number) {
    this.internalDispatch = Number.POSITIVE_INFINITY;
    this.queue?.dispatch({
      type: 'SET_INDEX',
      payload: index
    });
    this.internalDispatch = 0;
  }

  moveItem(fromIndex: number, toIndex: number) {
    this.internalDispatch = Number.POSITIVE_INFINITY;
    const data = this._videoList.splice(fromIndex, 1)[0];
    this._videoList.splice(toIndex, 0, data);
    this.queue?.dispatch({
      type: 'MOVE_ITEM',
      payload: {
        fromIndex,
        toIndex
      }
    });
    this.internalDispatch = 0;
    setTimeout(() => {
      this.initQueue();
      this.syncQueueOwner();
    }, 0);
  }

  on(listener: QueueEventListener) {
    this.listeners.push(listener);
  }

  off(listener: QueueEventListener) {
    this.listeners = this.listeners.filter((it) => it !== listener);
  }

  rollbackInjection() {
    if (!this.queue) {
      console.error('Queue is not initialized!');
      return;
    }

    if (this.originalDispatch) this.queue.store.dispatch = this.originalDispatch;
  }

  injection() {
    if (!this.queue) {
      console.error('Queue is not initialized!');
      return;
    }

    this.originalDispatch = this.queue.store.dispatch;
    this.queue.store.dispatch = (event) => {
      if (!this.queue || !this.owner) {
        console.error('Queue is not initialized!');
        return;
      }

      if (this.internalDispatch <= 0) {
        if (event.type === 'CLEAR') {
          this.internalDispatch = 1;
        }
        if (event.type === 'ADD_ITEMS') {
          if (((event.payload as any)?.items?.length ?? 0) > 1) return;
          this.broadcast({
            type: 'ADD_SONGS',
            payload: {
              // index: (event.payload as any).index,
              videoList: mapQueueItem((it: any) => ({
                videoId: it.videoId,
                owner: this.owner!,
              } satisfies VideoData), (event.payload as any).items)
            }
          });

          return;
        }
        if (event.type === 'MOVE_ITEM') {
          this.broadcast({
            type: 'MOVE_SONG',
            payload: {
              fromIndex: (event.payload as any).fromIndex,
              toIndex: (event.payload as any).toIndex
            }
          });
          return;
        }
        if (event.type === 'REMOVE_ITEM') {
          this.broadcast({
            type: 'REMOVE_SONG',
            payload: {
              index: event.payload as number
            }
          });
          return;
        }
        if (event.type === 'SET_INDEX') {
          this.broadcast({
            type: 'SYNC_PROGRESS',
            payload: {
              index: event.payload as number
            }
          });
          return;
        }
      } else {
        if (event.type === 'ADD_ITEMS') {
          this.internalDispatch -= 1;
          if (this.internalDispatch <= 0) {
            this.broadcast({
              type: 'ADD_SONGS',
              payload: {
                videoList: mapQueueItem((it: any) => ({
                  videoId: it.videoId,
                  owner: this.owner!,
                } satisfies VideoData), (event.payload as any).items)
              }
            });

            return;
          }
        }
      }

      const fakeContext = {
        ...this.queue,
        store: {
          ...this.queue.store,
          dispatch: this.originalDispatch
        }
      };
      this.originalDispatch!.call(fakeContext, event);
    };
  }

  /* sync */
  async initQueue() {
    if (!this.queue) return;

    this.queue.autoPlaying = false;
    this.queue.continuation = undefined;
    this.queue.dispatch({
      type: 'SHIFT_AUTOPLAY_ITEMS'
    });
    this.queue.dispatch({
      type: 'SET_SHUFFLE_ENABLED',
      payload: false
    });
    this.queue.dispatch({
      type: 'SET_IS_PREFETCHING_CONTINUATIONS',
      payload: false
    });
    this.queue.dispatch({
      type: 'SET_PLAYER_PAGE_WATCH_NEXT_METADATA',
      payload: null
    });
    this.queue.dispatch({
      type: 'SET_PLAYER_PAGE_WATCH_NEXT_AUTOMIX_PARAMS',
      payload: ''
    });
    this.queue.dispatch({
      type: 'SET_PLAYER_PAGE_WATCH_NEXT_CONTINUATION_PARAMS',
      payload: ''
    });
    this.queue.dispatch({
      type: 'SET_IS_INFINITE',
      payload: false
    });
    this.queue.dispatch({
      type: 'SET_IS_GENERATING',
      payload: true
    });
    this.queue.dispatch({
      type: 'SET_AUTOPLAY_ENABLED',
      payload: false
    });
    this.queue.dispatch({
      type: 'HAS_USER_CHANGED_DEFAULT_AUTOPLAY_MODE',
      payload: false
    });
    this.queue.dispatch({
      type: 'HAS_SHOWN_AUTOPLAY',
      payload: false
    });
  }

  async syncVideo() {
    const response = await getMusicQueueRenderer(this._videoList.map((it) => it.videoId));
    if (!response) return false;

    const items = response.queueDatas.map((it) => it.content);

    this.internalDispatch = Number.POSITIVE_INFINITY;
    this.queue?.dispatch({
      type: 'UPDATE_ITEMS',
      payload: {
        items: items,
        nextQueueItemId: this.queue.store.getState().queue.nextQueueItemId,
        shouldAssignIds: true,
        currentIndex: -1
      }
    });
    this.internalDispatch = 0;
    setTimeout(() => {
      this.initQueue();
      this.syncQueueOwner();
    }, 0);

    return true;
  }

  async syncQueueOwner() {
    console.trace('syncQueueOwner');
    const allQueue = document.querySelectorAll('#queue');

    allQueue.forEach((queue) => {
      const list = Array.from(queue?.querySelectorAll<HTMLElement>('ytmusic-player-queue-item') ?? []);

      list.forEach((item) => {
        const index = (item as any).data?.navigationEndpoint?.watchEndpoint?.index;
        if (typeof index !== 'number') return;

        const data = this._videoList[index]?.owner;

        const profile = item.querySelector<HTMLImageElement>('.music-together-owner') ?? document.createElement('img');
        profile.classList.add('music-together-owner');

        if (data) {
          profile.dataset.thumbnail = data.thumbnail ?? '';
          profile.dataset.name = data.name ?? '';
          profile.dataset.handleId = data.handleId ?? '';
          profile.dataset.id = data.id ?? '';

          profile.src = data.thumbnail ?? '';
          profile.title = data.name ?? '';
          profile.alt = data.handleId ?? '';
        }

        if (!profile.isConnected) item.append(profile);
      });
    });
  }

  removeQueueOwner() {
    const allQueue = document.querySelectorAll('#queue');

    allQueue.forEach((queue) => {
      const list = Array.from(queue?.querySelectorAll<HTMLElement>('ytmusic-player-queue-item') ?? []);

      list.forEach((item) => {
        const profile = item.querySelector<HTMLImageElement>('.music-together-owner');
        profile?.remove();
      });
    });
  }

  /* private */
  private broadcast(event: ConnectionEventUnion) {
    this.listeners.forEach((listener) => listener(event));
  }
}
