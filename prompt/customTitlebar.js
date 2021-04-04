const customTitlebar = require("custom-electron-titlebar");

module.exports = () => {
    const bar = new customTitlebar.Titlebar({
		backgroundColor: customTitlebar.Color.fromHex("#050505"),
        minimizable: false,
        maximizable: false,
        unfocusEffect: true,
	});
    try {
        bar.updateMenu(null);
    } catch (e) {
        //will always throw type error - null isn't menu, but it works
    }
    let container = document.querySelector('#container');
    container.style.width = '100%';
    container.style.position = 'fixed';
    container.style.border = 'unset';
}