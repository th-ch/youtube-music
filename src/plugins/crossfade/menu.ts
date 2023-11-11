import prompt from 'custom-electron-prompt';

import { BrowserWindow } from 'electron';

import builder, { CrossfadePluginConfig } from './index';

import promptOptions from '../../providers/prompt-options';

export default builder.createMenu(({ window, getConfig, setConfig }) => {
  const promptCrossfadeValues = async (win: BrowserWindow, options: CrossfadePluginConfig): Promise<Omit<CrossfadePluginConfig, 'enabled'> | undefined> => {
    const res = await prompt(
      {
        title: 'Crossfade Options',
        type: 'multiInput',
        multiInputOptions: [
          {
            label: 'Fade in duration (ms)',
            value: options.fadeInDuration,
            inputAttrs: {
              type: 'number',
              required: true,
              min: '0',
              step: '100',
            },
          },
          {
            label: 'Fade out duration (ms)',
            value: options.fadeOutDuration,
            inputAttrs: {
              type: 'number',
              required: true,
              min: '0',
              step: '100',
            },
          },
          {
            label: 'Crossfade x seconds before end',
            value:
              options.secondsBeforeEnd,
            inputAttrs: {
              type: 'number',
              required: true,
              min: '0',
            },
          },
          {
            label: 'Fade scaling',
            selectOptions: { linear: 'Linear', logarithmic: 'Logarithmic' },
            value: options.fadeScaling,
          },
        ],
        resizable: true,
        height: 360,
        ...promptOptions(),
      },
      win,
    ).catch(console.error);

    if (!res) {
      return undefined;
    }

    let fadeScaling: 'linear' | 'logarithmic' | number;
    if (res[3] === 'linear' || res[3] === 'logarithmic') {
      fadeScaling = res[3];
    } else if (isFinite(Number(res[3]))) {
      fadeScaling = Number(res[3]);
    } else {
      fadeScaling = options.fadeScaling;
    }

    return {
      fadeInDuration: Number(res[0]),
      fadeOutDuration: Number(res[1]),
      secondsBeforeEnd: Number(res[2]),
      fadeScaling,
    };
  };

  return [
    {
      label: 'Advanced',
      async click() {
        const newOptions = await promptCrossfadeValues(window, await getConfig());
        if (newOptions) {
          setConfig(newOptions);
        }
      },
    },
  ];
});
