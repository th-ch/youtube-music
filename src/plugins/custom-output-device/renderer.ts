import { YoutubePlayer } from "@/types/youtube-player";
import { CustomOutputPluginConfig } from ".";
import { RendererContext } from "@/types/contexts";
import { createRenderer } from "@/utils";

const updateDeviceList = async (context: RendererContext<CustomOutputPluginConfig>) => {
  const new_devices: Record<string, string> = {};
  const devices = await navigator.mediaDevices.enumerateDevices().then(devices => devices.filter(device => device.kind === 'audiooutput'));
  for (const device of devices) {
    new_devices[device.deviceId] = device.label;
  }
  const options = await context.getConfig();
  options.devices = new_devices;
  context.setConfig(options);
}

const updateSinkId = async (audioContext?: AudioContext, sinkId?: string) => {
  if (!audioContext || !sinkId) return;

  if (!('setSinkId' in audioContext)) {
    console.log('setSinkId not in context')
    return;
  }
  if (typeof audioContext.setSinkId !== 'function') {
    console.log('setSinkId not a function')
    return;
  }
  await audioContext.setSinkId(sinkId)
}

export const renderer = createRenderer<{
  options?: CustomOutputPluginConfig;
  audio_context?: AudioContext;
  audioCanPlayHandler: (event: CustomEvent<Compressor>) => Promise<void>;
}, CustomOutputPluginConfig>({
  async audioCanPlayHandler({ detail: { audioContext } }) {
    this.audio_context = audioContext
    await updateSinkId(audioContext, this.options!.output);
  },

  async onPlayerApiReady(_: YoutubePlayer, context) {
    this.options = await context.getConfig();
    await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    navigator.mediaDevices.ondevicechange = async () => await updateDeviceList(context);

    document.addEventListener('ytmd:audio-can-play', this.audioCanPlayHandler, { once: true, passive: true });
    await updateDeviceList(context);
  },

  stop() {
    document.removeEventListener('ytmd:audio-can-play', this.audioCanPlayHandler);
    navigator.mediaDevices.ondevicechange = null;
  },

  async onConfigChange(config) {
    this.options = config;
    await updateSinkId(this.audio_context, config.output);
  }
});
