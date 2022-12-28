const { setMenuOptions } = require("../../config/plugins");

module.exports = (win, options) => [
    {
        label: "Mode",
        submenu: [
            {
                label: "Custom toggle",
                type: "radio",
                checked: options.mode === 'custom',
                click: () => {
                    options.mode = 'custom';
                    setMenuOptions("video-toggle", options);
                }
            },
            {
                label: "Native toggle",
                type: "radio",
                checked: options.mode === 'native',
                click: () => {
                    options.mode = 'native';
                    setMenuOptions("video-toggle", options);
                }
            },
            {
                label: "Disabled",
                type: "radio",
                checked: options.mode === 'disabled',
                click: () => {
                    options.mode = 'disabled';
                    setMenuOptions("video-toggle", options);
                }
            },
        ]
    },
    {
        label: "Alignment",
        submenu: [
            {
                label: "Left",
                type: "radio",
                checked: options.align === 'left',
                click: () => {
                    options.align = 'left';
                    setMenuOptions("video-toggle", options);
                }
            },
            {
                label: "Middle",
                type: "radio",
                checked: options.align === 'middle',
                click: () => {
                    options.align = 'middle';
                    setMenuOptions("video-toggle", options);
                }
            },
            {
                label: "Right",
                type: "radio",
                checked: options.align === 'right',
                click: () => {
                    options.align = 'right';
                    setMenuOptions("video-toggle", options);
                }
            },
        ]
    },
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
