const { menuCheck, setOption, refreshChromecast } = require("./back");

module.exports = (_win, options) => {
    menuCheck(options);
    return [
        {
            label: "Sync Volume",
            type: "checkbox",
            checked: !!options.syncVolume,
            click: (item) => setOption(item.checked, "syncVolume")
        },
        {
            label: "Sync Start Time",
            type: "checkbox",
            checked: !!options.syncStartTime,
            click: (item) => setOption(item.checked, "syncStartTime")
        },
        {
            label: "Sync Seek",
            type: "checkbox",
            checked: !!options.syncSeek,
            click: (item) => setOption(item.checked, "syncSeek")
        },
        { type: "separator" },
        {
            label: "Refresh Device List",
            click: refreshChromecast
        }
    ]
};
