import { BrowserWindow, ipcMain } from 'electron';

import mpris, { Track } from '@jellybrick/mpris-service';

import registerCallback from '@/providers/song-info';
import getSongControls from '@/providers/song-controls';
import config from '@/config';

function setupMPRIS() {
  const instance = new mpris({
    name: 'youtube-music',
    identity: 'YouTube Music',
    supportedMimeTypes: ['audio/mpeg'],
    supportedInterfaces: ['player'],
  });
  instance.canRaise = true;
  instance.supportedUriSchemes = ['https'];
  instance.desktopEntry = 'youtube-music';
  return instance;
}

function registerMPRIS(win: BrowserWindow) {
  const songControls = getSongControls(win);
  const { playPause, next, previous, volumeMinus10, volumePlus10, shuffle } = songControls;
  try {
    // TODO: "Typing" for this arguments
    const secToMicro = (n: unknown) => Math.round(Number(n) * 1e6);
    const microToSec = (n: unknown) => Math.round(Number(n) / 1e6);

    const seekTo = (e: { position: unknown }) => win.webContents.send('seekTo', microToSec(e.position));
    const seekBy = (o: unknown) => win.webContents.send('seekBy', microToSec(o));

    const player = setupMPRIS();

    ipcMain.on('ytmd:player-api-loaded', () => {
      win.webContents.send('setupSeekedListener', 'mpris');
      win.webContents.send('setupTimeChangedListener', 'mpris');
      win.webContents.send('setupRepeatChangedListener', 'mpris');
      win.webContents.send('setupVolumeChangedListener', 'mpris');
    });

    ipcMain.on('seeked', (_, t: number) => player.seeked(secToMicro(t)));

    let currentSeconds = 0;
    ipcMain.on('timeChanged', (_, t: number) => currentSeconds = t);

    ipcMain.on('repeatChanged', (_, mode: string) => {
      switch (mode) {
        case 'NONE': {
          player.loopStatus = mpris.LOOP_STATUS_NONE;
          break;
        }
        case 'ONE': {
          player.loopStatus = mpris.LOOP_STATUS_TRACK;
          break;
        }
        case 'ALL': {
          player.loopStatus = mpris.LOOP_STATUS_PLAYLIST;
          // No default
          break;
        }
      }
    });
    player.on('loopStatus', (status: string) => {
      // SwitchRepeat cycles between states in that order
      const switches = [mpris.LOOP_STATUS_NONE, mpris.LOOP_STATUS_PLAYLIST, mpris.LOOP_STATUS_TRACK];
      const currentIndex = switches.indexOf(player.loopStatus);
      const targetIndex = switches.indexOf(status);

      // Get a delta in the range [0,2]
      const delta = (targetIndex - currentIndex + 3) % 3;
      songControls.switchRepeat(delta);
    });
    player.getPosition = () => secToMicro(currentSeconds);

    player.on('raise', () => {
      win.setSkipTaskbar(false);
      win.show();
    });

    player.on('play', () => {
      if (player.playbackStatus !== mpris.PLAYBACK_STATUS_PLAYING) {
        player.playbackStatus = mpris.PLAYBACK_STATUS_PLAYING;
        playPause();
      }
    });
    player.on('pause', () => {
      if (player.playbackStatus !== mpris.PLAYBACK_STATUS_PAUSED) {
        player.playbackStatus = mpris.PLAYBACK_STATUS_PAUSED;
        playPause();
      }
    });
    player.on('playpause', () => {
      player.playbackStatus = player.playbackStatus === mpris.PLAYBACK_STATUS_PLAYING ? mpris.PLAYBACK_STATUS_PAUSED : mpris.PLAYBACK_STATUS_PLAYING;
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
    player.on('open', (args: { uri: string }) => { win.loadURL(args.uri); });

    let mprisVolNewer = false;
    let autoUpdate = false;
    ipcMain.on('volumeChanged', (_, newVol) => {
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
          'mpris:trackid': '/',
        };
        if (songInfo.album) {
          data['xesam:album'] = songInfo.album;
        }

        player.metadata = data;
        player.seeked(secToMicro(songInfo.elapsedSeconds));
        player.playbackStatus = songInfo.isPaused ? mpris.PLAYBACK_STATUS_PAUSED : mpris.PLAYBACK_STATUS_PLAYING;
      }
    });
  } catch (error) {
    console.warn('Error in MPRIS', error);
  }
}

export default registerMPRIS;
