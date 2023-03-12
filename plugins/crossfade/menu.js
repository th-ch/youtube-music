const { setOptions } = require("../../config/plugins");
const defaultOptions = require("../../config/defaults").plugins.crossfade;

const prompt = require("custom-electron-prompt");
const promptOptions = require("../../providers/prompt-options");

module.exports = (win, options) => [
	{
		label: "Advanced",
		click: async () => {
			const newOptions = await promptCrossfadeValues(win, options);
			setOptions("crossfade", { ...options, ...newOptions });
		},
	},
];

async function promptCrossfadeValues(win, options) {
	const res = await prompt(
		{
			title: "Crossfade Options",
			label: "",
			type: "multiInput",
			multiInputOptions: [
				{
					label: "Fade in duration (ms)",
					value: options.fadeInDuration || defaultOptions.fadeInDuration,
					inputAttrs: {
						type: "number",
						required: true,
						min: 0,
						step: 100,
					},
				},
				{
					label: "Fade out duration (ms)",
					value: options.fadeOutDuration || defaultOptions.fadeOutDuration,
					inputAttrs: {
						type: "number",
						required: true,
						min: 0,
						step: 100,
					},
				},
				{
					label: "Crossfade x seconds before end",
					value:
						options.exitMusicBeforeEnd || defaultOptions.exitMusicBeforeEnd,
					inputAttrs: {
						type: "number",
						required: true,
						min: 0,
					},
				},
				{
					label: "Fade scaling",
					selectOptions: { linear: "Linear", exponential: "Exponential" },
					value: options.fadeScaling || defaultOptions.fadeScaling,
				},
			],
			resizable: true,
			height: 355,
			...promptOptions(),
		},
		win,
	).catch(console.error);
	if (!res) return undefined;
	return {
		fadeInDuration: res[0],
		fadeOutDuration: res[1],
		exitMusicBeforeEnd: res[2],
		fadeScaling: res[3],
	};
}
