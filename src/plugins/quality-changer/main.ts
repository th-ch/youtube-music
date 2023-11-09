import { ipcMain, dialog, BrowserWindow } from 'electron';

export default (win: BrowserWindow) => {
  ipcMain.handle('qualityChanger', async (_, qualityLabels: string[], currentIndex: number) => await dialog.showMessageBox(win, {
    type: 'question',
    buttons: qualityLabels,
    defaultId: currentIndex,
    title: 'Choose Video Quality',
    message: 'Choose Video Quality:',
    detail: `Current Quality: ${qualityLabels[currentIndex]}`,
    cancelId: -1,
  }));
};
