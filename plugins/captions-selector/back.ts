import { BrowserWindow, ipcMain } from 'electron';
import prompt from 'custom-electron-prompt';

import promptOptions from '../../providers/prompt-options';

export default (win: BrowserWindow) => {
  ipcMain.handle('captionsSelector', async (_, captionLabels: Record<string, string>, currentIndex: string) => await prompt(
    {
      title: 'Choose Caption',
      label: `Current Caption: ${captionLabels[currentIndex] || 'None'}`,
      type: 'select',
      value: currentIndex,
      selectOptions: captionLabels,
      resizable: true,
      ...promptOptions(),
    },
    win,
  ));
};
