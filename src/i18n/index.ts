import { use } from 'i18next';
import backend from 'i18next-electron-fs-backend';

export const i18n = use(backend).createInstance({
  backend: {
    loadPath: './app/localization/locales/{{lng}}/{{ns}}.json',
    addPath: './app/localization/locales/{{lng}}/{{ns}}.missing.json',
    contextBridgeApiKey: 'api' // needs to match first parameter of contextBridge.exposeInMainWorld in preload file; defaults to "api"
  },

  // other options you might configure
  debug: true,
  saveMissing: true,
  saveMissingTo: 'current',
  lng: 'en'
});

