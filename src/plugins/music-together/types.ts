import { YoutubePlayer } from '@/types/youtube-player';
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
export type AppAPI = {
  queue_: QueueAPI;
  playerApi_: YoutubePlayer;
  openToast: (message: string) => void;

  // TODO: Add more
};



export type Profile = {
  id: string;
  handleId: string;
  name: string;
  thumbnail: string;
};
export type VideoData = {
  videoId: string;
  ownerId: string;
};
export type Permission = 'host-only' | 'playlist' | 'all';

export const getDefaultProfile = (connectionID: string, id: string = Date.now().toString()): Profile => {
  const name = `Guest ${id.slice(0, 4)}`;

  return {
    id: connectionID,
    handleId: `#music-together:${id}`,
    name,
    thumbnail: `https://ui-avatars.com/api/?name=${name}&background=random`
  };
};
