import { createStore } from 'solid-js/store';

import { VideoData } from '../types';

export type QueueStoreType = {
  queue: VideoData[];
  title: string;
};
export const [queue, setQueue] = createStore<QueueStoreType>({
  queue: [],
  title: '',
});
