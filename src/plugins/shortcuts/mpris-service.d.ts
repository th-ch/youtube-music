declare module '@jellybrick/mpris-service' {
  import { EventEmitter } from 'events';

  import dbus from 'dbus-next';


  interface RootInterfaceOptions {
    identity: string;
    supportedUriSchemes: string[];
    supportedMimeTypes: string[];
    desktopEntry: string;
  }

  export interface Track {
    'mpris:trackid'?: string;
    'mpris:length'?: number;
    'mpris:artUrl'?: string;
    'xesam:album'?: string;
    'xesam:albumArtist'?: string[];
    'xesam:artist'?: string[];
    'xesam:asText'?: string;
    'xesam:audioBPM'?: number;
    'xesam:autoRating'?: number;
    'xesam:comment'?: string[];
    'xesam:composer'?: string[];
    'xesam:contentCreated'?: string;
    'xesam:discNumber'?: number;
    'xesam:firstUsed'?: string;
    'xesam:genre'?: string[];
    'xesam:lastUsed'?: string;
    'xesam:lyricist'?: string[];
    'xesam:title'?: string;
    'xesam:trackNumber'?: number;
    'xesam:url'?: string;
    'xesam:useCount'?: number;
    'xesam:userRating'?: number;
  }

  declare class Player extends EventEmitter {
    constructor(opts: {
      name: string;
      identity: string;
      supportedMimeTypes?: string[];
      supportedInterfaces?: string[];
    });

    name: string;
    identity: string;
    fullscreen: boolean;
    supportedUriSchemes: string[];
    supportedMimeTypes: string[];
    canQuit: boolean;
    canRaise: boolean;
    canSetFullscreen: boolean;
    hasTrackList: boolean;
    desktopEntry: string;
    playbackStatus: string;
    loopStatus: string;
    shuffle: boolean;
    metadata: object;
    volume: number;
    canControl: boolean;
    canPause: boolean;
    canPlay: boolean;
    canSeek: boolean;
    canGoNext: boolean;
    canGoPrevious: boolean;
    rate: number;
    minimumRate: number;
    maximumRate: number;
    playlists: unknown[];
    activePlaylist: string;

    init(opts: RootInterfaceOptions): void;

    objectPath(subpath?: string): string;

    getPosition(): number;

    seeked(position: number): void;

    getTrackIndex(trackId: string): number;

    getTrack(trackId: string): Track;

    addTrack(track: Track): void;

    removeTrack(trackId: string): void;

    getPlaylistIndex(playlistId: string): number;

    setPlaylists(playlists: Track[]): void;

    setActivePlaylist(playlistId: string): void;

    static PLAYBACK_STATUS_PLAYING: 'Playing';
    static PLAYBACK_STATUS_PAUSED: 'Paused';
    static PLAYBACK_STATUS_STOPPED: 'Stopped';
    static LOOP_STATUS_NONE: 'None';
    static LOOP_STATUS_TRACK: 'Track';
    static LOOP_STATUS_PLAYLIST: 'Playlist';
  }

  interface MprisInterface extends dbus.interface.Interface {
    setProperty(property: string, valuePlain: unknown): void;
  }

  interface RootInterface {
  }

  interface PlayerInterface {
  }

  interface TracklistInterface {

    TrackListReplaced(tracks: Track[]): void;

    TrackAdded(afterTrack: string): void;

    TrackRemoved(trackId: string): void;
  }

  interface PlaylistsInterface {

    PlaylistChanged(playlist: unknown[]): void;

    setActivePlaylistId(playlistId: string): void;
  }

  export default Player;
}
