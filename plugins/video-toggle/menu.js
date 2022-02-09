const { setMenuOptions } = require("../../config/plugins");

module.exports = (win, options) => [
    {
        label: "Force Remove Video Tab",
        type: "checkbox",
        checked: options.forceHide,
        click: item => {
            options.forceHide = item.checked;
            setMenuOptions("video-toggle", options);
        }
    }
];
