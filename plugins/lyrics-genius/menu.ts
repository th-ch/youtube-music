import { BrowserWindow, MenuItem } from 'electron';

import { LyricGeniusType, toggleRomanized } from './back';

import { setOptions } from '../../config/plugins';
import { MenuTemplate } from '../../menu';

export default (_: BrowserWindow, options: LyricGeniusType): MenuTemplate => [
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
