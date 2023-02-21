const prompt = require("custom-electron-prompt");

const { setMenuOptions } = require("../../config/plugins");
const { toggleRomanized, romanized } = require("./back");

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