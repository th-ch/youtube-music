const { readdirSync } = require("fs");
const path = require("path");

const { setMenuOptions } = require("../../config/plugins");

const visualizerTypes = readdirSync(path.join(__dirname, "visualizers")).map(
	(filename) => path.parse(filename).name
);

module.exports = (win, options) => [
	{
		label: "Type",
		submenu: visualizerTypes.map((visualizerType) => ({
			label: visualizerType,
			type: "radio",
			checked: options.type === visualizerType,
			click: () => {
				options.type = visualizerType;
				setMenuOptions("visualizer", options);
			},
		})),
	},
];
