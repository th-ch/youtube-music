const { ipcMain } = require("electron");

const prompt = require("custom-electron-prompt");
const promptOptions = require("../../providers/prompt-options");

module.exports = (win) => {
	ipcMain.handle("captionsSelector", async (_, captionLabels, currentIndex) => {
		return await prompt(
			{
				title: "Choose Caption",
				label: `Current Caption: ${captionLabels[currentIndex] || "None"}`,
				type: "select",
				value: currentIndex,
				selectOptions: captionLabels,
				resizable: true,
				...promptOptions(),
			},
			win
		);
	});
};
