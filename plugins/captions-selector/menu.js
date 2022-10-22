const { setOptions } = require('../../config/plugins');

module.exports = (_win, options) => [
    {
        label: "No captions by default",
        type: "checkbox",
        checked: options.disabledCaptions,
        click: (item) => {
            setOptions("captions-selector", { disableCaptions: item.checked });
        },
    }
];
