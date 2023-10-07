import prompt from 'custom-electron-prompt';

import { BrowserWindow } from 'electron';

import config from './config';

import promptOptions from '../../providers/prompt-options';
import configOptions from '../../config/defaults';

import { MenuTemplate } from '../../menu';

import type { ConfigType } from '../../config/dynamic';

const defaultOptions = configOptions.plugins.crossfade;

export default (win: BrowserWindow): MenuTemplate => [
  {
    label: 'Advanced',
    async click() {
      const newOptions = await promptCrossfadeValues(win, config.getAll());
      if (newOptions) {
        config.setAll(newOptions);
      }
    },
  },
];

async function promptCrossfadeValues(win: BrowserWindow, options: ConfigType<'crossfade'>): Promise<Partial<ConfigType<'crossfade'>> | undefined> {
  const res = await prompt(
    {
      title: 'Crossfade Options',
      type: 'multiInput',
      multiInputOptions: [
        {
          label: 'Fade in duration (ms)',
          value: options.fadeInDuration || defaultOptions.fadeInDuration,
          inputAttrs: {
            type: 'number',
            required: true,
            min: '0',
            step: '100',
          },
        },
        {
          label: 'Fade out duration (ms)',
          value: options.fadeOutDuration || defaultOptions.fadeOutDuration,
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
            options.secondsBeforeEnd || defaultOptions.secondsBeforeEnd,
          inputAttrs: {
            type: 'number',
            required: true,
            min: '0',
          },
        },
        {
          label: 'Fade scaling',
          selectOptions: { linear: 'Linear', logarithmic: 'Logarithmic' },
          value: options.fadeScaling || defaultOptions.fadeScaling,
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

  return {
    fadeInDuration: Number(res[0]),
    fadeOutDuration: Number(res[1]),
    secondsBeforeEnd: Number(res[2]),
    fadeScaling: res[3],
  };
}
