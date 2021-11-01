const { remote, ipcRenderer } = require("electron");

const customTitlebar = require("custom-electron-titlebar");
function $(selector) { return document.querySelector(selector); }

module.exports = () => {
	const bar = new customTitlebar.Titlebar({
		backgroundColor: customTitlebar.Color.fromHex("#050505"),
		itemBackgroundColor: customTitlebar.Color.fromHex("#121212"),
	});
	bar.updateTitle(" ");
	document.title = "Youtube Music";

	ipcRenderer.on("updateMenu", function (_event, showMenu) {
		bar.updateMenu(showMenu ? remote.Menu.getApplicationMenu() : null);
	});

	// Increases the right margin of Navbar background when the scrollbar is visible to avoid blocking it (z-index doesn't affect it)
	document.addEventListener('apiLoaded', () => {
		setNavbarMargin();
		const playPageObserver = new MutationObserver(setNavbarMargin);
		playPageObserver.observe($('ytmusic-app-layout'), { attributeFilter: ['player-page-open_', 'playerPageOpen_'] })
	}, { once: true, passive: true })
};

function setNavbarMargin() {
	$('#nav-bar-background').style.right =
		$('ytmusic-app-layout').playerPageOpen_ ?
			'0px' :
			'12px';
}
