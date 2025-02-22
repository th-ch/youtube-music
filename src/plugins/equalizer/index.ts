import { createPlugin } from '@/utils';
import { t } from '@/i18n';
import { Preset, defaultCustomPresets, defaultPresets } from './presets';

import appConfig from '../../config';

let filters: BiquadFilterNode[] = [];

let storedAudioSource: AudioNode;
let storedAudioContext: AudioContext;

function clearFilters() {
  filters.forEach((filter) => filter.disconnect());
  filters = [];
  storedAudioSource.disconnect();
  storedAudioSource.connect(storedAudioContext.destination);
}

function createFilters(
  preset: Preset,
  audioContext: AudioContext,
): BiquadFilterNode[] {
  const filters = preset.filters.map((band) => {
    const filter = audioContext.createBiquadFilter();
    filter.type = band.type || ('peaking' as BiquadFilterType);
    filter.frequency.value = band.freq || 0;
    filter.Q.value = band.Q || 1;
    filter.gain.value = band.gain || 0;
    return filter;
  });
  return filters;
}

function connectFilters(
  filters: BiquadFilterNode[],
  audioSource: AudioNode,
  audioContext: AudioContext,
) {
  let currentNode: AudioNode = audioSource;
  for (const filter of filters) {
    currentNode.connect(filter);
    currentNode = filter;
  }
  currentNode.connect(audioContext.destination);
}

export default createPlugin({
  name: () => t('plugins.equalizer.name'),
  description: () => t('plugins.equalizer.description'),
  restartNeeded: false,
  addedVersion: '3.7.X',
  config: {
    enabled: false,
    selectedPreset: 'flat', // Default preset
    customPresets: [] as Preset[],
  },
  menu: async ({ getConfig, setConfig }) => {
    const config = await getConfig();

    const allPresetsD = config.customPresets.concat(defaultPresets);

    const checkedPreset = allPresetsD.some(
      (preset) => preset.name === config.selectedPreset,
    )
      ? config.selectedPreset
      : 'flat';

    return [
      {
        label: t('plugins.equalizer.menu.presets.label'),
        submenu: allPresetsD.map((preset) => ({
          restartNeeded: true,
          label: config.customPresets.includes(preset)
            ? preset.name
            : t(`plugins.equalizer.menu.presets.list.${preset.name}`),
          type: 'radio',
          checked: checkedPreset === preset.name,
          click() {
            setConfig({ selectedPreset: preset.name });
          },
        })),
      },
      {
        type: 'separator',
      },
      {
        label: t('plugins.equalizer.menu.reset-custom-presets'),
        toolTip: t('plugins.equalizer.menu.reset-custom-presets-tooltip'),
        click() {
          setConfig({ customPresets: defaultCustomPresets });
        },
      },
      {
        label: t('plugins.equalizer.menu.edit-config'),
        toolTip: t('plugins.equalizer.menu.edit-config-tooltip'),
        click() {
          appConfig.edit();
        },
      },
    ];
  },
  renderer: {
    async start(context) {
      const config = await context.getConfig();

      const allPresets = config.customPresets.concat(defaultPresets);

      const specifiedPreset =
        allPresets.find((preset) => preset.name === config.selectedPreset) ||
        allPresets.find((preset) => preset.name === 'flat');

      if (!specifiedPreset) {
        return;
      }

      if (!storedAudioSource || !storedAudioContext) {
        document.addEventListener(
          'ytmd:audio-can-play',
          ({ detail: { audioSource, audioContext } }) => {
            // Store audioSource and audioContext
            storedAudioSource = audioSource;
            storedAudioContext = audioContext;

            filters = createFilters(specifiedPreset, audioContext);
            audioSource.disconnect();
            connectFilters(filters, audioSource, audioContext);
          },
          { once: true, passive: true },
        );
      } else {
        filters = createFilters(specifiedPreset, storedAudioContext);
        storedAudioSource.disconnect();
        connectFilters(filters, storedAudioSource, storedAudioContext);
      }
    },
    onConfigChange(newConfig) {
      if (!storedAudioSource || !storedAudioContext) {
        return;
      }

      clearFilters();

      const allPresets = newConfig.customPresets.concat(defaultPresets);
      const specifiedPreset =
        allPresets.find((preset) => preset.name === newConfig.selectedPreset) ||
        allPresets.find((preset) => preset.name === 'flat');

      if (!specifiedPreset) {
        return;
      }

      filters = createFilters(specifiedPreset, storedAudioContext);
      storedAudioSource.disconnect();
      connectFilters(filters, storedAudioSource, storedAudioContext);
    },
    stop() {
      clearFilters();
    },
  },
});
