import prompt from 'custom-electron-prompt';

import builder from './index';

import promptOptions from '../../providers/prompt-options';

export default builder.createMain(({ handle }) => ({
  onLoad(window) {
    handle('captionsSelector', async (_, captionLabels: Record<string, string>, currentIndex: string) => await prompt(
      {
        title: 'Choose Caption',
        label: `Current Caption: ${captionLabels[currentIndex] || 'None'}`,
        type: 'select',
        value: currentIndex,
        selectOptions: captionLabels,
        resizable: true,
        ...promptOptions(),
      },
      window,
    ));
  }
}));
