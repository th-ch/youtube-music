declare module './default' {
    interface WindowSize {
        width: number;
        height: number;
    }

    interface Options {
        language: string;
        startAtLogin: boolean;
        hideMenu: boolean;
        autoUpdates: boolean;
        alwaysOnTop: boolean;
        tray: boolean;
    }

    interface Config {
        "window-size": WindowSize;
        options: Options;
    }

    const config: Config;
    export default config;
}
