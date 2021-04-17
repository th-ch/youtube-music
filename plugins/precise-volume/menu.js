const { enabled } = require("./back")
const { setOptions } = require("../../config/plugins");

module.exports = (win, options) => [
	{
		label: "Arrowkeys controls",
		type: "checkbox",
		checked: !!options.arrowsShortcut,
		click: (item) => {
            //dynamically change setting if plugin enabled
            if (enabled()) {
                win.webContents.send("setArrowsShortcut", item.checked);
            } else { //fallback to usual method if disabled
                options.arrowsShortcut = item.checked;
                setOptions("precise-volume", options);
            }
        }
	}
];
