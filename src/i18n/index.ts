import i18next, { init, t as i18t } from 'i18next';

import enJson from './resources/en.json';
import koJson from './resources/ko.json';

export const loadI18n = async () =>
  await init({
    resources: {
      en: {
        translation: enJson
      },
      ko: {
        translation: koJson
      }
    },
    lng: 'en',
    interpolation: {
      escapeValue: false
    }
  });
loadI18n();

export const t = i18t.bind(i18next);

