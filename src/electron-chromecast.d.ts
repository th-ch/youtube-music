declare module '@jellybrick/electron-chromecast' {
  export const chrome: typeof window.chrome;
  export const requestHandler: (receiverList: Array<object>) => Promise<unknown>;
  export const castSetting: {
    devMode: boolean;
  };
  export const castConsole: {
    log: (message: unknown[]) => void;
    info: (message: unknown[]) => void;
    warn: (message: unknown[]) => void;
    error: (message: unknown[]) => void;
  };
  export const injectChromeCompatToObject: (obj: object) => void;
}
