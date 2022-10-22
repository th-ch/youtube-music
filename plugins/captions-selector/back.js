const { ipcMain, dialog } = require("electron");

module.exports = () => {
	ipcMain.handle('captionsSelector', async (_, captionLabels, currentIndex) => {
         return await dialog.showMessageBox({
            type: "question",
            buttons: captionLabels,
            defaultId: currentIndex,
            title: "Choose Caption",
            message: "Choose Caption:",
            detail: `Current Caption: ${captionLabels[currentIndex]}`,
            cancelId: -1
        })
    })
};
