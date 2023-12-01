import i18next, { init, t as i18t, changeLanguage } from 'i18next';

import { languageResources } from 'virtual:i18n';

export const loadI18n = async () =>
  await init({
    resources: languageResources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export const setLanguage = async (language: string) =>
  await changeLanguage(language);

export const t = i18t.bind(i18next);
