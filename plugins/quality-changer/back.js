const { ipcMain, dialog } = require("electron");

module.exports = () => {
	ipcMain.handle('qualityChanger', async (_, qualityLabels, currentIndex) => {
         return await dialog.showMessageBox({
            type: "question",
            buttons: qualityLabels,
            defaultId: currentIndex,
            title: "Choose Video Quality",
            message: "Choose Video Quality:",
            detail: `Current Quality: ${qualityLabels[currentIndex]}`,
            cancelId: -1
        })
    })
};
