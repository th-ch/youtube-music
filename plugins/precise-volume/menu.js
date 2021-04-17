module.exports = (win, options) => [
	{
		label: "Arrowkeys controls",
		type: "checkbox",
		checked: !!options.arrowsShortcut,
		click: (item) => {
            win.webContents.send("setArrowsShortcut", item.checked);
        }
	}
];
