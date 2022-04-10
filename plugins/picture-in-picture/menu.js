const { setOptions } = require("./back.js");

module.exports = (win, options) => [
    {
        label: "Always on top",
        type: "checkbox",
        checked: options.alwaysOnTop,
        click: (item) => {
            setOptions({ alwaysOnTop: item.checked });
            win.setAlwaysOnTop(item.checked);
        },
    },
    {
        label: "Save window position",
        type: "checkbox",
        checked: options.savePosition,
        click: (item) => {
            setOptions({ savePosition: item.checked });
        },
    },
    {
        label: "Save window size",
        type: "checkbox",
        checked: options.saveSize,
        click: (item) => {
            setOptions({ saveSize: item.checked });
        },
    }
];
