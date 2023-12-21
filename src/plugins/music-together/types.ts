export type Profile = {
  id: string;
  handleId: string;
  name: string;
  thumbnail?: string;
};
export type VideoData = {
  videoId: string;
  owner: Profile;
};
export type Permission = 'host-only' | 'all';

export const getDefaultProfile = (connectionID: string, id: string = Date.now().toString()): Profile => ({
  id: connectionID,
  handleId: `#music-together:${id}`,
  name: `Guest ${id.slice(0, 4)}`
});
