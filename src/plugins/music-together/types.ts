export type MusicTogetherConfig = {
  enabled: boolean;
};
export type User = {
  id: string;
  handleId: string;
  name: string;
  thumbnail: string;
};
export type VideoData = {
  videoId: string;
  ownerId: string;
};
export type ConnectedState = 'disconnected' | 'host' | 'guest' | 'connecting';
export type Permission = 'host-only' | 'playlist' | 'all';

export type ConnectionEventMap = {
  ADD_SONGS: { videoList: VideoData[]; index?: number };
  REMOVE_SONG: { index: number };
  MOVE_SONG: { fromIndex: number; toIndex: number };
  IDENTIFY: { user: User } | undefined;
  SYNC_USER: { users: User[] } | undefined;
  SYNC_QUEUE: { videoList: VideoData[] } | undefined;
  SYNC_PROGRESS:
    | { progress?: number; state?: number; index?: number }
    | undefined;
  PERMISSION: Permission | undefined;
};
export type ConnectionEventUnion = {
  [Event in keyof ConnectionEventMap]: {
    type: Event;
    payload: ConnectionEventMap[Event];
    after?: ConnectionEventUnion[];
  };
}[keyof ConnectionEventMap];
