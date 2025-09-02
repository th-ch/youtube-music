// import { t } from "@/i18n";
import promptOptions from "@/providers/prompt-options";
import { createPlugin } from "@/utils";
import prompt from "custom-electron-prompt";
import { onConfigChange, onPlayerApiReady, stop } from "./renderer";

export interface CustomOutputPluginConfig {
  enabled: boolean;
  output: string;
  devices: Record<string, string>;
}


export default createPlugin({
  name: () => 'Custom Output Device',
  description: () => 'Configure a custom output media device for songs.',
  restartNeeded: true,
  config: {
    enabled: false,
    output: 'default',
    devices: {}
  } as CustomOutputPluginConfig,
  menu: async ({ setConfig, getConfig, window }) => {

    const promptDeviceSelector = async () => {
      const options = await getConfig();

      const response = await prompt({
        title: 'Select Output Device',
        label: 'Choose the output media device to be used',
        value: options.output || 'default',
        type: 'select',
        selectOptions: options.devices,
        width: 500,
        ...promptOptions(),
      }, window).catch(console.error);

      if (!response) return;
      options.output = response;
      setConfig(options);
    }

    return [
      {
        label: 'Select Device',
        click: promptDeviceSelector
      }
    ]
  },

  renderer: {
    onPlayerApiReady,
    stop,
    onConfigChange,
  }
})
