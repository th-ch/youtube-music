import { nativeImage } from 'electron';

import playIcon from '@assets/media-icons-black/play.png?asset&asarUnpack';
import pauseIcon from '@assets/media-icons-black/pause.png?asset&asarUnpack';
import nextIcon from '@assets/media-icons-black/next.png?asset&asarUnpack';
import previousIcon from '@assets/media-icons-black/previous.png?asset&asarUnpack';

import { createPlugin } from '@/utils';
import getSongControls from '@/providers/song-controls';
import registerCallback, { type SongInfo } from '@/providers/song-info';
import { mediaIcons } from '@/types/media-icons';
import { t } from '@/i18n';

export default createPlugin({
  name: () => t('plugins.taskbar-mediacontrol.name'),
  description: () => t('plugins.taskbar-mediacontrol.description'),
  restartNeeded: true,
  config: {
    enabled: false,
  },

  backend({ window }) {
    let currentSongInfo: SongInfo;

    const { playPause, next, previous } = getSongControls(window);

    const setThumbar = (songInfo: SongInfo) => {
      // Wait for song to start before setting thumbar
      if (!songInfo?.title) {
        return;
      }

      // Win32 require full rewrite of components
      window.setThumbarButtons([
        {
          tooltip: 'Previous',
          icon: nativeImage.createFromPath(get('previous')),
          click() {
            previous();
          },
        },
        {
          tooltip: 'Play/Pause',
          // Update icon based on play state
          icon: nativeImage.createFromPath(
            songInfo.isPaused ? get('play') : get('pause'),
          ),
          click() {
            playPause();
          },
        },
        {
          tooltip: 'Next',
          icon: nativeImage.createFromPath(get('next')),
          click() {
            next();
          },
        },
      ]);
    };

    // Util
    const get = (kind: keyof typeof mediaIcons): string => {
      switch (kind) {
        case 'play':
          return playIcon;
        case 'pause':
          return pauseIcon;
        case 'next':
          return nextIcon;
        case 'previous':
          return previousIcon;
        default:
          return '';
      }
    };

    registerCallback((songInfo) => {
      // Update currentsonginfo for win.on('show')
      currentSongInfo = songInfo;
      // Update thumbar
      setThumbar(songInfo);
    });

    // Need to set thumbar again after win.show
    window.on('show', () => {
      setThumbar(currentSongInfo);
    });
  },
});
