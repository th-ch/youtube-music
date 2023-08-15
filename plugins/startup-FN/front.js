const { ipcRenderer } = require('electron');

ipcRenderer.send('mediaKeysActivated');

ipcRenderer.on('playPause', () => {
  const playPauseButton = document.querySelector('.play-pause-button');
  if (playPauseButton) {
    playPauseButton.click();
  }
});

ipcRenderer.on('nextTrack', () => {
  const nextTrackButton = document.querySelector('.next-button');
  if (nextTrackButton) {
    nextTrackButton.click();
  }
});

ipcRenderer.on('previousTrack', () => {
  const previousTrackButton = document.querySelector('.previous-button');
  if (previousTrackButton) {
    previousTrackButton.click();
  }
});
