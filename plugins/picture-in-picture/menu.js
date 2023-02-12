const prompt = require("custom-electron-prompt");

const promptOptions = require("../../providers/prompt-options");
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
    },
    {
        label: "Hotkey",
        type: "checkbox",
        checked: options.hotkey,
        click: async (item) => {
            const output = await prompt({
                title: "Picture in Picture Hotkey",
                label: "Choose a hotkey for toggling Picture in Picture",
                type: "keybind",
                keybindOptions: [{
                        value: "hotkey",
                        label: "Hotkey",
                        default: options.hotkey
                }],
                ...promptOptions()
            }, win)

            if (output) {
                const { value, accelerator } = output[0];
                setOptions({ [value]: accelerator });

                item.checked = !!accelerator;
            } else {
                // Reset checkbox if prompt was canceled
                item.checked = !item.checked;
            }
        },
    },
    {
        label: "Use native PiP",
        type: "checkbox",
        checked: options.useNativePiP,
        click: (item) => {
            setOptions({ useNativePiP: item.checked });
        },
    }
];
