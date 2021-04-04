const customTitlebar = require("custom-electron-titlebar");

module.exports = () => {
    const bar = new customTitlebar.Titlebar({
		backgroundColor: customTitlebar.Color.fromHex("#050505"),
	});
    try {
        bar.updateMenu(null);
    } catch (e) {
        //will always throw type error - null isn't menu, but it works
    }
}