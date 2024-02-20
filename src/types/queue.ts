import type { YoutubePlayer } from '@/types/youtube-player';
import type {
  GetState,
  ItemPlaylistPanelVideoRenderer,
  PlaylistPanelVideoWrapperRenderer,
  QueueItem,
} from '@/types/datahost-get-state';

type StoreState = GetState;
type Store = {
  dispatch: (obj: {
    type: string;
    payload?: {
      items?: QueueItem[];
    };
  }) => void;

  getState: () => StoreState;
  replaceReducer: (param1: unknown) => unknown;
  subscribe: (callback: () => void) => unknown;
}

export type QueueElement = HTMLElement & {
  dispatch(obj: {
    type: string;
    payload?: unknown;
  }): void;
  queue: QueueAPI;
};
export type QueueAPI = {
  getItems(): Item[];
  store: {
    store: Store,
  };
  continuation?: string;
  autoPlaying?: boolean;
};
export type AppElement = HTMLElement & AppAPI;
export type AppAPI = {
  queue_: QueueAPI;
  playerApi_: YoutubePlayer;
  openToast: (message: string) => void;

  // TODO: Add more
};

export interface Item {
  playlistPanelVideoRenderer?: ItemPlaylistPanelVideoRenderer;
  playlistPanelVideoWrapperRenderer?: PlaylistPanelVideoWrapperRenderer;
}
