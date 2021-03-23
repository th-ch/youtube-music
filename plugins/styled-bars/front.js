const customTitlebar = require('custom-electron-titlebar');

module.exports = () => {
    const myBar = new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#030303'),
        itemBackgroundColor: customTitlebar.Color.fromHex('#121212'), //#020
    });
    myBar.updateTitle(' ');
    document.title = "Youtube Music";
}
