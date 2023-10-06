import { ipcMain, dialog } from 'electron';

export default () => {
  ipcMain.handle('qualityChanger', async (_, qualityLabels: string[], currentIndex: number) => await dialog.showMessageBox({
    type: 'question',
    buttons: qualityLabels,
    defaultId: currentIndex,
    title: 'Choose Video Quality',
    message: 'Choose Video Quality:',
    detail: `Current Quality: ${qualityLabels[currentIndex]}`,
    cancelId: -1,
  }));
};
