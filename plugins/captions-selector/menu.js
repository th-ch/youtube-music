const config = require("./config");

module.exports = () => [
    {
        label: "Automatically select last used caption",
        type: "checkbox",
        checked: config.get("autoload"),
        click: (item) => {
            config.set('autoload', item.checked);
        }
    },
    {
        label: "No captions by default",
        type: "checkbox",
        checked: config.get("disabledCaptions"),
        click: (item) => {
            config.set('disableCaptions', item.checked);
        },
    }
];
