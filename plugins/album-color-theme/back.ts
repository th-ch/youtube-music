import { getAverageColor } from 'fast-average-color-node';
import { BrowserWindow } from 'electron';

import style from './style.css';

import { injectCSS } from '../utils';
import registerCallback from '../../providers/song-info';

export default (win: BrowserWindow) => {
  injectCSS(win.webContents, style);

  registerCallback((songInfo) => {
    const songTitle = songInfo.title;
    const songImage = songInfo.imageSrc;

    if (songImage && songTitle) {
      getAverageColor(songImage)
        .then((color) => {
          //div.style.backgroundColor = color.rgba;
          //console.log('Average color', color);
          if (color.hex === '#000000') {
            color.rgb = 'rgb(238,238,238)';
            color.isDark = false;
            color.isLight = true;
          } else if (color.hex === '#ffffff') {
            color.rgb = 'rgb(0,0,0)';
            color.isDark = true;
            color.isLight = false;
          }
          win.webContents.send('album-color-changed', color);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  });

};
