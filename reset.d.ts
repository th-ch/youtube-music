import '@total-typescript/ts-reset';
import { YoutubePlayer } from './types/youtube-player';

declare global {
  interface DocumentEventMap {
    'apiLoaded': CustomEvent<YoutubePlayer>;
  }

  interface Window {
    /**
     * YouTube Music internal variable (Last interaction time)
     */
    _lact: number;
  }
}
