const { ipcRenderer } = require("electron");
const config = require("../../config");
const { Titlebar, Color } = require("custom-electron-titlebar");
const { isEnabled } = require("../../config/plugins");
function $(selector) { return document.querySelector(selector); }

module.exports = (options) => {
	let visible = !config.get("options.hideMenu");
	const bar = new Titlebar({
		backgroundColor: Color.fromHex("#050505"),
		itemBackgroundColor: Color.fromHex("#1d1d1d"),
		svgColor: Color.WHITE,
		menu: visible ? undefined : null
	});
	bar.updateTitle(" ");
	document.title = "Youtube Music";

	const hideIcon = hide => $('.cet-window-icon').style.display = hide ? 'none' : 'flex';

	if (options.hideIcon) hideIcon(true);

	ipcRenderer.on("refreshMenu", (_, showMenu) => {
		if (showMenu === undefined && !visible) return;
		if (showMenu === false) {
			bar.updateMenu(null);
			visible = false;
		} else {
			bar.refreshMenu();
			visible = true;
		}
	});

	if (isEnabled("picture-in-picture")) {
		ipcRenderer.on("pip-toggle", (_, pipEnabled) => {
			bar.refreshMenu();
		});
	}

	ipcRenderer.on("hideIcon", (_, hide) => hideIcon(hide));

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
