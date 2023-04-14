const prompt = require("custom-electron-prompt");
const { dialog } = require("electron");

const { setOptions, getOptions } = require("../../config/plugins");
const promptOptions = require("../../providers/prompt-options");
const axios = require("axios");

const { getKey } = require('./back')

module.exports = (win, options) => [
    {
        label: "Set API key",
        click: () => setKey(win),
    },
];

async function setKey(win) {
    const options = getOptions("api")
    const key = await getKey(options)

    let output = await prompt({
        title: 'Set API key',
        label: 'Enter new API key:',
        value: key,
        type: "input",
        width: 450,
        ...promptOptions()
    }, win)

    if (output) {
        options.key = output;
        try {
            await axios.put("https://youtube-music-api.zohan.tech/api/key", { key, newKey: output });
            setOptions("api", options);
        } catch (err) {
            if (err.response.data.error == 'New key already exists') {
                console.warn('New key already exists')
                setOptions("api", options);
                dialog.showMessageBox(win, {
                    message: 'The key you entered is already in use; if this is not your key, please set a different key to prevent device overlap.',
                    type: 'warning',
                    buttons: ['Ok'],
                    title: 'Warning: Key exists!'
                })
            }
        }
    }
}