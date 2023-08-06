//const { albumColor } = require('./back');
const { ipcRenderer } = require("electron");
//const { ElementFromFile, templatePath } = require("../utils");


var songTitle;
var songImage;

function hexToHSL(H) {
	// Convert hex to RGB first
	let r = 0, g = 0, b = 0;
	if (H.length == 4) {
	  r = "0x" + H[1] + H[1];
	  g = "0x" + H[2] + H[2];
	  b = "0x" + H[3] + H[3];
	} else if (H.length == 7) {
	  r = "0x" + H[1] + H[2];
	  g = "0x" + H[3] + H[4];
	  b = "0x" + H[5] + H[6];
	}
	// Then to HSL
	r /= 255;
	g /= 255;
	b /= 255;
	let cmin = Math.min(r,g,b),
		cmax = Math.max(r,g,b),
		delta = cmax - cmin,
		h = 0,
		s = 0,
		l = 0;
  
	if (delta == 0)
	  h = 0;
	else if (cmax == r)
	  h = ((g - b) / delta) % 6;
	else if (cmax == g)
	  h = (b - r) / delta + 2;
	else
	  h = (r - g) / delta + 4;
  
	h = Math.round(h * 60);
  
	if (h < 0)
	  h += 360;
  
	l = (cmax + cmin) / 2;
	s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
	s = +(s * 100).toFixed(1);
	l = +(l * 100).toFixed(1);
  
	//return "hsl(" + h + "," + s + "%," + l + "%)";
	return [h,s,l];
  }

  //updated elements
const playerPage = document.querySelector("#player-page");
const navBarBackground = document.querySelector("#nav-bar-background");
const ytmusicPlayerBar = document.querySelector("ytmusic-player-bar");
//const ytmusicAvToggle1 = document.querySelector(".song-button.ytmusic-av-toggle");
//const ytmusicAvToggle2 = document.querySelector(".video-button.ytmusic-av-toggle");
//const ytmusicAvToggleBg = document.querySelector(".av-toggle.ytmusic-av-toggle");
const playerBarBackground = document.querySelector("#player-bar-background");
const songImageElement = document.querySelector("#song-image");
const sidebarBig = document.querySelector("#guide-wrapper");
const sidebarSmall = document.querySelector("#mini-guide-background");
const ytmusicAppLayout = document.querySelector("#layout");

var [hue, saturation, lightness] = [0,0,0];

//songImageElement.style.filter = "drop-shadow(0 0 3rem black)";

function changeElementColor(element, hue, saturation, lightness){
	element.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	//element.style.color = albumColor.isDark ? '#ffffff' : '#000000';
}

function changeColor() {
	
	const observer = new MutationObserver((mutationsList) => {
		for (const mutation of mutationsList) {
		  /*if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
			const visibility = window.getComputedStyle(playerPage).getPropertyValue('visibility');
			if (visibility === 'visible') {
				changeElementColor(sidebarSmall, hue, saturation, 30);
			} else {
				sidebarSmall.style.backgroundColor = 'black';
			}
		  }*/
		  if (mutation.type === 'attributes') {
			const isPageOpen = ytmusicAppLayout.hasAttribute('player-page-open');
			if(isPageOpen) {
				changeElementColor(sidebarSmall, hue, saturation, 30);
				//sidebarSmall.style.backgroundColor = 'blue';
			}
			else{
				sidebarSmall.style.backgroundColor = 'black';
			}
		  }
		}
	  });

	  observer.observe(playerPage, { attributes: true });
	
	ipcRenderer.on("album-color-changed", (_, albumColor) => {
		if (albumColor) {
			[hue, saturation, lightness] = hexToHSL(albumColor.hex);
			changeElementColor(playerPage, hue, saturation, 30);
			changeElementColor(navBarBackground, hue, saturation, 15);
			changeElementColor(ytmusicPlayerBar, hue, saturation, 15);
			changeElementColor(playerBarBackground, hue, saturation, 15);
			changeElementColor(sidebarBig, hue, saturation, 15);
			if (ytmusicAppLayout.hasAttribute('player-page-open'))
				changeElementColor(sidebarSmall, hue, saturation, 30);
			const ytRightClickList = document.querySelector("tp-yt-paper-listbox");
			changeElementColor(ytRightClickList, hue, saturation, 15);

		} else {
			playerPage.style.backgroundColor = "#000000";
		}
	});
}



module.exports = changeColor;