const config = require("./config");
const defaultOptions = require("../../config/defaults").plugins.crossfade;

const prompt = require("custom-electron-prompt");
const promptOptions = require("../../providers/prompt-options");

module.exports = (win) => [
	{
		label: "Advanced",
		click: async () => {
			const newOptions = await promptCrossfadeValues(win, config.getAll());
			if (newOptions) config.setAll(newOptions);
		},
	},
];

async function promptCrossfadeValues(win, options) {
	const res = await prompt(
		{
			title: "Crossfade Options",
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
						options.secondsBeforeEnd || defaultOptions.secondsBeforeEnd,
					inputAttrs: {
						type: "number",
						required: true,
						min: 0,
					},
				},
				{
					label: "Fade scaling",
					selectOptions: { linear: "Linear", logarithmic: "Logarithmic" },
					value: options.fadeScaling || defaultOptions.fadeScaling,
				},
			],
			resizable: true,
			height: 360,
			...promptOptions(),
		},
		win,
	).catch(console.error);
	if (!res) return undefined;
	return {
		fadeInDuration: Number(res[0]),
		fadeOutDuration: Number(res[1]),
		secondsBeforeEnd: Number(res[2]),
		fadeScaling: res[3],
	};
}
