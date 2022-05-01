const { setOptions } = require("../../config/plugins");

module.exports = (win, options) => [
    {
        label: "Hide Icon",
        type: "checkbox",
        checked: options.hideIcon,
        click: (item) => {
            win.webContents.send("hideIcon", item.checked);
            options.hideIcon = item.checked;
            setOptions("in-app-menu", options);
        },
    }
];
