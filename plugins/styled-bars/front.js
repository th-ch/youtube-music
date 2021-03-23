const customTitlebar = require('custom-electron-titlebar');
const {remote, ipcRenderer} = require('electron');

module.exports = () => {
	//const windowProxy = window.open('https://music.youtube.com', null);
	const myBar = new customTitlebar.Titlebar({
		backgroundColor: customTitlebar.Color.fromHex('#030303'),
		itemBackgroundColor: customTitlebar.Color.fromHex('#121212')
	});
	myBar.updateTitle(' ');
	document.title = 'Youtube Music';

	ipcRenderer.on('updateMenu', function(event, menu) {
		//let menu = Menu.buildFromTemplate(template);
		//Menu.setApplicationMenu(menu);
		if(menu)
			myBar.updateMenu(remote.Menu.getApplicationMenu());
		else
			myBar.updateMenu(null);
	});
};