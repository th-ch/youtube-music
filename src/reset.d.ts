import '@total-typescript/ts-reset';
import { YoutubePlayer } from './types/youtube-player';

declare global {
  interface Compressor {
    audioSource: MediaElementAudioSourceNode;
    audioContext: AudioContext;
  }

  interface DocumentEventMap {
    'apiLoaded': CustomEvent<YoutubePlayer>;
    'audioCanPlay': CustomEvent<Compressor>;
  }

  interface Window {
    /**
     * YouTube Music internal variable (Last interaction time)
     */
    _lact: number;
    navigation: Navigation;
    download: () => void;
    togglePictureInPicture: () => void;
    reload: () => void;
  }
}

  // import { Howl as _Howl } from 'howler';
declare module 'howler' {
  interface Howl {
    _sounds: {
      _paused: boolean;
      _ended: boolean;
      _id: string;
      _node: HTMLMediaElement;
    }[];
  }
}
