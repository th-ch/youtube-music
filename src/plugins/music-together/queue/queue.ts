import { getMusicQueueRenderer } from './song';
import type { Profile, VideoData } from '../types';
import { mapQueueItem } from './utils';

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
  getProfile: (id: string) => Profile | null;
}
export class Queue {
  private _videoList: VideoData[] = [];
  private queue: (HTMLElement & QueueAPI) | null = null;
  private getProfile: (id: string) => Profile | null;
  constructor(
    options: QueueOptions,
    element = document.querySelector<HTMLElement & QueueAPI>('#queue'),
  ) {
    this.queue = element;
    this.getProfile = options.getProfile;
  }

  /* public */
  async setVideoList(videoList: VideoData[]) {
    this._videoList = videoList;

    await this.syncVideo();
  }

  async addVideo(video: VideoData) {
    const response = await getMusicQueueRenderer([video.videoId]);
    if (!response) return false;

    const item = response.queueDatas[0]?.content;
    if (!item) return false;

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
    return this.queue?.store.getState().queue.items;
  }

  /* sync */
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

      this.syncQueueOwner();
    }, 0);

    return true;
  }

  async syncQueueOwner() {
    const allQueue = document.querySelectorAll('#queue');

    allQueue.forEach((queue) => {
      const list = Array.from(queue?.querySelectorAll<HTMLElement>(':not(#counterpart-renderer) > ytmusic-player-queue-item') ?? []);

      list.forEach((item, index) => {
        const ownerId = this._videoList[index]?.owner.id;

        const profile = item.querySelector<HTMLImageElement>('.music-together-owner') ?? document.createElement('img');
        profile.classList.add('music-together-owner');

        const data = this.getProfile(ownerId);
        if (data) {
          profile.src = data.thumbnail ?? '';
          profile.title = data.name ?? '';
          profile.alt = data.id ?? '';
        }

        if (!profile.isConnected) item.append(profile);
      });
    });
  }
}
