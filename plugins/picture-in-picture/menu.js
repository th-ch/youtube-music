const { setOptions } = require("./back.js");

module.exports = (_win, options) => [
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
