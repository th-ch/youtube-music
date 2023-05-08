const config = require("./config");

module.exports = () => [
	{
		label: "Blocker",
		submenu: Object.values(config.blockers).map((blocker) => ({
			label: blocker,
			type: "radio",
			checked: config.get("blocker") === blocker,
			click: () => {
				config.set("blocker", blocker);
			},
		})),
	},
];
