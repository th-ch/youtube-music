import type { OfflineTranslatorPluginConfig } from './index';
import type { BackendContext } from '@/types/contexts';
import { pipeline, Pipeline } from '@xenova/transformers';
import { ipcMain } from 'electron';

let translator: Pipeline | null = null;
let modelReady = false;
let modelError: string | null = null;

export const onMainLoad = async (context: BackendContext<OfflineTranslatorPluginConfig>) => {
  const config = await context.getConfig();
  console.log('Offline Translator plugin loaded in main process. Initializing model...', config);

  modelReady = false;
  modelError = null;

  try {
    // Initialize the translator pipeline
    // The first time you run this, it will download the model.
    // So, it might take a while.
    translator = await pipeline('translation', 'Xenova/nllb-200-distilled-600M');
    modelReady = true;
    console.log('Offline translation model loaded successfully.');
  } catch (error) {
    console.error('Failed to load offline translation model:', error);
    modelError = (error as Error).message;
    modelReady = false;
    translator = null; // Ensure translator is null if loading fails
  }
};

ipcMain.handle('translateText', async (_event, { text, sourceLanguageCode, targetLanguageCode }) => {
  if (modelError) {
    console.error('translateText: Translator model failed to load:', modelError);
    return { error: `Translator model failed to load: ${modelError}` };
  }
  if (!modelReady) {
    console.warn('translateText: Translator model is still loading.');
    return { error: 'Translator model is still loading, please try again shortly.' };
  }
  if (!translator) {
    // This case should ideally be covered by modelError or !modelReady,
    // but as a safeguard:
    console.error('translateText: Translator not initialized (unexpected state).');
    return { error: 'Translator not initialized (unexpected state).' };
  }

  if (!text || !targetLanguageCode || !sourceLanguageCode) {
    console.error('translateText: Missing text, sourceLanguageCode or targetLanguageCode');
    return { error: 'Missing text, sourceLanguageCode or targetLanguageCode' };
  }

  try {
    console.log(`Translating from ${sourceLanguageCode} to ${targetLanguageCode}: ${text.substring(0, 50)}...`);
    const result = await translator(text, {
      src_lang: sourceLanguageCode,
      tgt_lang: targetLanguageCode,
    });

    if (result && Array.isArray(result) && result.length > 0 && result[0].translation_text) {
      console.log('Translation successful:', result[0].translation_text.substring(0,50) + '...');
      return { translatedText: result[0].translation_text };
    }
    console.error('Translation failed or result format unexpected:', result);
    return { error: 'Translation failed or result format unexpected' };
  } catch (error) {
    console.error('Translation error:', error);
    return { error: `Translation failed: ${(error as Error).message}` };
  }
});

export const onConfigChange = async (config: OfflineTranslatorPluginConfig, _context: BackendContext<OfflineTranslatorPluginConfig>) => {
  console.log('Offline Translator config changed in main process', config);
  // Config changes like targetLanguage are handled on the renderer side when translation is requested.
  // If the model itself needed to change based on language, this would be the place.
  // For NLLB-200, it's multilingual, so no model change needed here for targetLanguage.
};
