const { setOptions } = require("../../config/plugins");
const { toggleRomanized } = require("./back");

module.exports = (win, options, refreshMenu) => {
	return [
		{
			label: "Romanized Lyrics",
			type: "checkbox",
			checked: options.romanizedLyrics,
			click: (item) => {
				options.romanizedLyrics = item.checked;
				setMenuOptions('lyrics-genius', options);
				toggleRomanized();
			},
		},
	];
};