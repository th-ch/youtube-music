import { CustomOutputPluginConfig } from ".";
import { RendererContext } from "@/types/contexts";

let options: CustomOutputPluginConfig;
let audio_context: AudioContext;
let first = true;

export const updateDeviceList = async () => {
  if (first) {
    await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    navigator.mediaDevices.ondevicechange = () => updateDeviceList()
    first = false;
  }

  const new_devices: Record<string, string> = {};
  const devices = await navigator.mediaDevices.enumerateDevices().then(devices => devices.filter(device => device.kind === 'audiooutput'));
  for (const device of devices) {
    new_devices[device.deviceId] = device.label;
  }
  options.devices = new_devices;
  return options;
}

const updateSinkId = async (context: AudioContext) => {
  if (!('setSinkId' in context)) {
    console.log('setSinkId not in context')
    return;
  }
  if (typeof context.setSinkId !== 'function') {
    console.log('setSinkId not a function')
    return;
  }
  await context.setSinkId(options.output)
}

const audioCanPlayHandler = ({ detail: { audioContext } }: CustomEvent<Compressor>) => {
  audio_context = audioContext
  updateSinkId(audioContext);
}

export const start = async (context: RendererContext<CustomOutputPluginConfig>) => {
  options = await context.getConfig();

  document.addEventListener('ytmd:audio-can-play', audioCanPlayHandler, { once: true, passive: true });
  await context.setConfig(await updateDeviceList());
}

export const stop = () => {
  document.removeEventListener('ytmd:audio-can-play', audioCanPlayHandler)
}

export const onConfigChange = (config: CustomOutputPluginConfig) => {
  options = config;
  updateSinkId(audio_context);
}
