const { menuCheck, setOption, refreshChromecast } = require("./back");

module.exports = (_win, options) => {
    menuCheck(options);
    return [
        { type: "separator" },
        {
            label: "Sync Volume",
            type: "checkbox",
            checked: !!options.syncVolume,
            click: (item) => setOption(item.checked, "syncVolume")
        },
        { type: "separator" },
        {
            label: "Sync Chromecast time with App",
            type: "radio",
            checked: !!options.syncChromecastTime,
            click: () =>
                setOption(true, "syncChromecastTime", { name: "syncAppTime", value: false })
        },
        {
            label: "Sync App time with Chromecast",
            type: "radio",
            checked: !!options.syncAppTime,
            click: () =>
                setOption(true, "syncAppTime", { name: "syncChromecastTime", value: false })
        },
        {
            label: "Disable time sync",
            type: "radio",
            checked: !options.syncAppTime && !options.syncChromecastTime,
            click: () => setOption(false, "syncAppTime", "syncChromecastTime")
        },
        { type: "separator" },
        {
            label: "Refresh Device List",
            click: refreshChromecast
        }
    ]
};
