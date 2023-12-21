import { getMusicQueueRenderer } from './song';
import { mapQueueItem } from './utils';

import type { VideoData } from '../types';

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
};
export type QueueOptions = {
  videoList?: VideoData[];
}
export class Queue {
  private _videoList: VideoData[] = [];
  private queue: (HTMLElement & QueueAPI) | null = null;

  constructor(
    options: QueueOptions = {},
    element = document.querySelector<HTMLElement & QueueAPI>('#queue'),
  ) {
    this.queue = element;
    this._videoList = options.videoList ?? [];
  }

  /* public */
  async setVideoList(videoList: VideoData[], sync = true) {
    this._videoList = videoList;

    if (sync) await this.syncVideo();
  }

  async addVideo(video: VideoData) {
    const response = await getMusicQueueRenderer([video.videoId]);
    if (!response) return false;

    const item = response.queueDatas[0]?.content;
    if (!item) return false;

    this._videoList.push(video);
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
    setTimeout(() => this.syncQueueOwner(), 0);

    return true;
  }

  async removeVideo(index: number) {
    this._videoList.splice(index, 1);
    this.queue?.dispatch({
      type: 'REMOVE_ITEM',
      payload: index
    });
    setTimeout(() => this.syncQueueOwner(), 0);
  }

  setIndex(index: number) {
    this.queue?.dispatch({
      type: 'SET_INDEX',
      payload: index
    });
  }

  /* utils */
  get videoList() {
    return this._videoList;
  }

  get selectedIndex() {
    return mapQueueItem((it) => it?.selected, this.queue?.store.getState().queue.items).findIndex(Boolean) ?? 0;
  }
  get rawItems() {
    console.log(this.queue)
    return this.queue?.store.getState().queue.items;
  }

  get flatItems() {
    return mapQueueItem((it) => it, this.rawItems);
  }

  /* sync */
  async initQueue() {
    this.queue?.dispatch({
      type: 'SET_IS_INFINITE',
      payload: false
    });
    this.queue?.dispatch({
      type: 'SET_IS_PREFETCHING_CONTINUATIONS',
      payload: false
    });
    this.queue?.dispatch({
      type: 'SET_IS_GENERATING',
      payload: false
    });
    this.queue?.dispatch({
      type: 'SET_AUTOPLAY_ENABLED',
      payload: false
    });
    this.queue?.dispatch({
      type: 'HAS_USER_CHANGED_DEFAULT_AUTOPLAY_MODE',
      payload: false
    });
  }

  async syncVideo() {
    const response = await getMusicQueueRenderer(this._videoList.map((it) => it.videoId));
    if (!response) return false;

    const items = response.queueDatas.map((it) => it.content);

    this.queue?.dispatch({
      type: 'UPDATE_ITEMS',
      payload: {
        items: items,
        nextQueueItemId: this.queue.store.getState().queue.nextQueueItemId,
        shouldAssignIds: true,
        currentIndex: -1
      }
    });
    setTimeout(() => {
      this.initQueue();
      this.syncQueueOwner();
    }, 0);

    return true;
  }

  async syncQueueOwner() {
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
}
