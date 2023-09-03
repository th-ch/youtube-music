import { BrowserWindow, MenuItem } from 'electron';

import { LyricGeniusType, toggleRomanized } from './back';

import { setOptions } from '../../config/plugins';

module.exports = (win: BrowserWindow, options: LyricGeniusType) => [
  {
    label: 'Romanized Lyrics',
    type: 'checkbox',
    checked: options.romanizedLyrics,
    click(item: MenuItem) {
      options.romanizedLyrics = item.checked;
      setOptions('lyrics-genius', options);
      toggleRomanized();
    },
  },
];
