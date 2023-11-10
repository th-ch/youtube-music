import { dialog, BrowserWindow } from 'electron';

import builder from './index';

export default builder.createMain(({ handle }) => ({
  onLoad(win: BrowserWindow) {
    handle('qualityChanger', async (qualityLabels: string[], currentIndex: number) => await dialog.showMessageBox(win, {
      type: 'question',
      buttons: qualityLabels,
      defaultId: currentIndex,
      title: 'Choose Video Quality',
      message: 'Choose Video Quality:',
      detail: `Current Quality: ${qualityLabels[currentIndex]}`,
      cancelId: -1,
    }));
  }
}));
