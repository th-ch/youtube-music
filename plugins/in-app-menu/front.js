const { ipcRenderer } = require("electron");
const config = require("../../config");
const { Titlebar, Color } = require("custom-electron-titlebar");
const { isEnabled } = require("../../config/plugins");
function $(selector) { return document.querySelector(selector); }

module.exports = (options) => {
	let visible = !config.get("options.hideMenu");
	const bar = new Titlebar({
		icon: "https://cdn-icons-png.flaticon.com/512/5358/5358672.png",
		backgroundColor: Color.fromHex("#050505"),
		itemBackgroundColor: Color.fromHex("#1d1d1d"),
		svgColor: Color.WHITE,
		menu: visible ? undefined : null
	});
	bar.updateTitle(" ");
	document.title = "Youtube Music";

	const icon = $('.cet-window-icon');

	icon.style.webkitAppRegion = 'no-drag';

	icon.firstChild.style.webkitUserDrag = 'none';
	icon.firstChild.style.filter = 'invert(50%)';

	const updateMenu = () => {
		if (visible) {
			bar.updateMenu(null);
			visible = false;
		} else {
			bar.refreshMenu();
			visible = true;
		}
	};

	icon.addEventListener('click', updateMenu);

	ipcRenderer.on("refreshMenu", (_, fromBack) => {
		if (fromBack === undefined && !visible) return;
		updateMenu();
	});

	if (isEnabled("picture-in-picture")) {
		ipcRenderer.on("pip-toggle", (_, pipEnabled) => {
			bar.refreshMenu();
		});
	}

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
