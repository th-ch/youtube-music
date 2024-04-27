import { createPlugin } from '@/utils';
import { RefinedLyricsConfig } from './config';

import renderer from "./contexts/renderer";
import backend from "./contexts/backend";
import sheet from "./style.css?inline"

// Temporary hack to not mess with translations for now.
// prettier-ignore
const t = ([txt]: TemplateStringsArray) => () => txt;

export default createPlugin({
  name: t`Refined Lyrics`,
  authors: ['Arjix'],
  stylesheets: [sheet],
  restartNeeded: true,

  config: <RefinedLyricsConfig>{
    enabled: false,
  },

  renderer,
  backend
});
