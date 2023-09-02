declare module 'custom-electron-prompt' {
  import { BrowserWindow } from 'electron';

  export interface PromptCounterOptions {
    minimum?: number;
    maximum?: number;
    multiFire?: boolean;
  }

  export interface PromptKeybindOptions {
    value: string;
    label: string;
    default: string;
  }

  export interface PromptOptions {
    width?: number;
    height?: number;
    resizable?: boolean;
    title?: string;
    label?: string;
    buttonLabels?: {
      ok?: string;
      cancel?: string;
    };
    alwaysOnTop?: boolean;
    value?: unknown;
    type?: 'input' | 'select' | 'counter' | 'multiInput';
    selectOptions?: Record<string, string>;
    keybindOptions?: PromptKeybindOptions[];
    counterOptions?: PromptCounterOptions;
    icon?: string;
    useHtmlLabel?: boolean;
    customStylesheet?: string;
    menuBarVisible?: boolean;
    skipTaskbar?: boolean;
    frame?: boolean;
    customScript?: string;
    enableRemoteModule?: boolean;
    inputAttrs?: Partial<HTMLInputElement>;
    multiInputOptions?: {
      label: string;
      value: unknown;
      inputAttrs?: Partial<HTMLInputElement>;
      selectOptions?: Record<string, string>;
    }[];
  }

  const prompt: (options?: PromptOptions, parent?: BrowserWindow) => Promise<string | null>;

  export default prompt;
}
