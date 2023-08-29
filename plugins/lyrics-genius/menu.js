const { toggleRomanized } = require('./back');

const { setOptions } = require('../../config/plugins');

module.exports = (win, options, refreshMenu) => [
  {
    label: 'Romanized Lyrics',
    type: 'checkbox',
    checked: options.romanizedLyrics,
    click(item) {
      options.romanizedLyrics = item.checked;
      setOptions('lyrics-genius', options);
      toggleRomanized();
    },
  },
];
