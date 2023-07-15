const path = require("path");
const { injectCSS } = require("../utils");

const getAverageColor = require('fast-average-color-node').getAverageColor;

const registerCallback = require("../../providers/song-info");


//var randomColor = "#A020F0";
//module.exports.randomColor = randomColor;


module.exports = (win) => {
	injectCSS(win.webContents, path.join(__dirname, "style.css"));

	registerCallback((songInfo) => {
		if (!songInfo.title && !songInfo.artist) {
			return;
		}
		songTitle = songInfo.title;
		songImage = songInfo.imageSrc;

		if(songTitle){
			getAverageColor(songImage, {algorithm: "simple"})
			.then(color => {
				//div.style.backgroundColor = color.rgba;
				//console.log('Average color', color);
				if (color.hex === "#000000") {
					color.rgb = "rgb(238,238,238)";
					color.isDark = false;
					color.isLight = true;
				  } else if (color.hex === "#ffffff") {
					color.rgb = "rgb(0,0,0)";
					color.isDark = true;
					color.isLight = false;
				  }
				const albumColor = color;
				console.log(albumColor.hex);
				win.webContents.send("album-color-changed", albumColor);
			})
			.catch(e => {
				console.log(e);
			});
		}
	})
	
};
