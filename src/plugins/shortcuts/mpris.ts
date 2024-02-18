import { BrowserWindow, ipcMain } from 'electron';

import MprisPlayer, { Track } from '@jellybrick/mpris-service';

import registerCallback, { type SongInfo } from '@/providers/song-info';
import getSongControls from '@/providers/song-controls';
import config from '@/config';
import { LoggerPrefix } from '@/utils';

class YTPlayer extends MprisPlayer {
  /**
   * @type {number} The current position in microseconds
   * @private
   */
  private currentPosition: number;

  constructor(opts: {
    name: string;
    identity: string;
    supportedMimeTypes?: string[];
    supportedInterfaces?: string[];
  }) {
    super(opts);

    this.currentPosition = 0;
  }

  setPosition(t: number) {
    this.currentPosition = t;
  }

  override getPosition(): number {
    return this.currentPosition;
  }

  setLoopStatus(status: string) {
    this.loopStatus = status;
  }

  isPlaying(): boolean {
    return this.playbackStatus === YTPlayer.PLAYBACK_STATUS_PLAYING;
  }

  isPaused(): boolean {
    return this.playbackStatus === YTPlayer.PLAYBACK_STATUS_PAUSED;
  }

  isStopped(): boolean {
    return this.playbackStatus === YTPlayer.PLAYBACK_STATUS_STOPPED;
  }

  setPlaybackStatus(status: string) {
    this.playbackStatus = status;
  }
}

function setupMPRIS() {
  const instance = new YTPlayer({
    name: 'youtube-music',
    identity: 'YouTube Music',
    supportedMimeTypes: ['audio/mpeg'],
    supportedInterfaces: ['player'],
  });
  instance.canRaise = true;
  instance.supportedUriSchemes = ['http', 'https'];
  instance.desktopEntry = 'youtube-music';
  return instance;
}

function registerMPRIS(win: BrowserWindow) {
  const songControls = getSongControls(win);
  const {
    playPause,
    next,
    previous,
    volumeMinus10,
    volumePlus10,
    shuffle,
    switchRepeat,
  } = songControls;
  try {
    let currentSongInfo: SongInfo | null = null;
    const secToMicro = (n: number) => Math.round(Number(n) * 1e6);
    const microToSec = (n: number) => Math.round(Number(n) / 1e6);

    const seekTo = (event: {
      trackId: string;
      position: number;
    }) => {
      if (event.trackId === currentSongInfo?.videoId) {
        win.webContents.send('ytmd:seek-to', microToSec(event.position ?? 0));
      }
    };
    const seekBy = (offset: number) =>
      win.webContents.send('ytmd:seek-by', microToSec(offset));

    const player = setupMPRIS();

    ipcMain.on('ytmd:player-api-loaded', () => {
      win.webContents.send('ytmd:setup-seeked-listener', 'mpris');
      win.webContents.send('ytmd:setup-time-changed-listener', 'mpris');
      win.webContents.send('ytmd:setup-repeat-changed-listener', 'mpris');
      win.webContents.send('ytmd:setup-volume-changed-listener', 'mpris');
    });

    ipcMain.on('ytmd:seeked', (_, t: number) => player.seeked(secToMicro(t)));

    ipcMain.on('ytmd:time-changed', (_, t: number) => {
      player.setPosition(secToMicro(t));
    });

    ipcMain.on('ytmd:repeat-changed', (_, mode: string) => {
      switch (mode) {
        case 'NONE': {
          player.setLoopStatus(YTPlayer.LOOP_STATUS_NONE);
          break;
        }
        case 'ONE': {
          player.setLoopStatus(YTPlayer.LOOP_STATUS_TRACK);
          break;
        }
        case 'ALL': {
          player.setLoopStatus(YTPlayer.LOOP_STATUS_PLAYLIST);
          // No default
          break;
        }
      }
    });
    player.on('loopStatus', (status: string) => {
      // SwitchRepeat cycles between states in that order
      const switches = [
        YTPlayer.LOOP_STATUS_NONE,
        YTPlayer.LOOP_STATUS_PLAYLIST,
        YTPlayer.LOOP_STATUS_TRACK,
      ];
      const currentIndex = switches.indexOf(player.loopStatus);
      const targetIndex = switches.indexOf(status);

      // Get a delta in the range [0,2]
      const delta = (targetIndex - currentIndex + 3) % 3;
      switchRepeat(delta);
    });

    player.on('raise', () => {
      win.setSkipTaskbar(false);
      win.show();
    });

    player.on('play', () => {
      if (!player.isPlaying()) {
        player.setPlaybackStatus(YTPlayer.PLAYBACK_STATUS_PLAYING);
        playPause();
      }
    });
    player.on('pause', () => {
      if (player.playbackStatus !== YTPlayer.PLAYBACK_STATUS_PAUSED) {
        player.setPlaybackStatus(YTPlayer.PLAYBACK_STATUS_PAUSED);
        playPause();
      }
    });
    player.on('playpause', () => {
      player.setPlaybackStatus(
        player.isPlaying()
          ? YTPlayer.PLAYBACK_STATUS_PAUSED
          : YTPlayer.PLAYBACK_STATUS_PLAYING
      );
      playPause();
    });

    player.on('next', next);
    player.on('previous', previous);

    player.on('seek', seekBy);
    player.on('position', seekTo);

    player.on('shuffle', (enableShuffle) => {
      if (enableShuffle) {
        shuffle();
      }
    });
    player.on('open', (args: { uri: string }) => {
      win.loadURL(args.uri);
    });

    let mprisVolNewer = false;
    let autoUpdate = false;
    ipcMain.on('ytmd:volume-changed', (_, newVol) => {
      if (~~(player.volume * 100) !== newVol) {
        if (mprisVolNewer) {
          mprisVolNewer = false;
          autoUpdate = false;
        } else {
          autoUpdate = true;
          player.volume = Number.parseFloat((newVol / 100).toFixed(2));
          mprisVolNewer = false;
          autoUpdate = false;
        }
      }
    });

    player.on('volume', (newVolume) => {
      if (config.plugins.isEnabled('precise-volume')) {
        // With precise volume we can set the volume to the exact value.
        const newVol = ~~(newVolume * 100);
        if (~~(player.volume * 100) !== newVol && !autoUpdate) {
          mprisVolNewer = true;
          autoUpdate = false;
          win.webContents.send('setVolume', newVol);
        }
      } else {
        // With keyboard shortcuts we can only change the volume in increments of 10, so round it.
        let deltaVolume = Math.round((newVolume - player.volume) * 10);
        while (deltaVolume !== 0 && deltaVolume > 0) {
          volumePlus10();
          player.volume += 0.1;
          deltaVolume--;
        }

        while (deltaVolume !== 0 && deltaVolume < 0) {
          volumeMinus10();
          player.volume -= 0.1;
          deltaVolume++;
        }
      }
    });

    registerCallback((songInfo) => {
      if (player) {
        const data: Track = {
          'mpris:length': secToMicro(songInfo.songDuration),
          'mpris:artUrl': songInfo.imageSrc ?? undefined,
          'xesam:title': songInfo.title,
          'xesam:url': songInfo.url,
          'xesam:artist': [songInfo.artist],
          'mpris:trackid': songInfo.videoId,
        };
        if (songInfo.album) {
          data['xesam:album'] = songInfo.album;
        }
        currentSongInfo = songInfo;

        player.metadata = data;

        const currentElapsedMicroSeconds = secToMicro(songInfo.elapsedSeconds ?? 0);
        player.setPosition(currentElapsedMicroSeconds);
        player.seeked(currentElapsedMicroSeconds);

        player.setPlaybackStatus(
          songInfo.isPaused ?
            YTPlayer.PLAYBACK_STATUS_PAUSED :
            YTPlayer.PLAYBACK_STATUS_PLAYING
        );
      }
    });
  } catch (error) {
    console.error(
      LoggerPrefix,
      'Error in MPRIS'
    );
    console.trace(error);
  }
}

export default registerMPRIS;
