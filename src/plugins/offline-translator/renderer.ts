import { ipcRenderer } from 'electron';
import type { OfflineTranslatorPluginConfig } from './index';
import type { RendererContext } from '@/types/contexts';

// Store original lyrics and button state
let originalLyricsHTML: string | null = null;
let isTranslated = false;

const displayTemporaryMessage = (lyricsContentElement: Element, originalHTML: string | null, message: string, duration: number = 3000) => {
  if (originalHTML === null) return; // Should not happen if we have something to revert to
  const tempMessageElement = document.createElement('small');
  tempMessageElement.style.color = message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') ? 'red' : 'orange';
  tempMessageElement.innerHTML = `<br>${message}`;
  
  lyricsContentElement.innerHTML = originalHTML; // Start with original
  lyricsContentElement.appendChild(tempMessageElement); // Append message

  setTimeout(() => {
    // Check if the temporary message is still part of the content
    if (lyricsContentElement.contains(tempMessageElement)) {
      lyricsContentElement.innerHTML = originalHTML; // Revert to original
    }
  }, duration);
};


export const onRendererLoad = async (context: RendererContext<OfflineTranslatorPluginConfig>) => {
  const config = await context.getConfig();
  if (!config.enabled) {
    console.log('Offline Translator plugin is disabled.');
    return;
  }
  console.log('Offline Translator renderer loaded.', config);

  const lyricsTabRenderer = document.querySelector('ytmusic-tab-renderer');
  if (!lyricsTabRenderer) {
    console.warn('Offline Translator: Lyrics tab renderer (ytmusic-tab-renderer) not found. Lyrics features will be unavailable.');
    return;
  }

  const setupTranslator = async (lyricsPageElement: Element) => {
    const lyricsContainer = lyricsPageElement.querySelector('ytmusic-message-renderer');
    if (!lyricsContainer) return;

    const lyricsContentElement = lyricsContainer.querySelector('#contents');
    if (!lyricsContentElement || !lyricsContentElement.textContent?.trim()) return;

    let translateButton = lyricsContainer.querySelector<HTMLButtonElement>('#translate-lyrics-button');
    if (translateButton) {
      // Update button text if config changed (e.g. target language)
      const currentConfig = await context.getConfig();
      if (!isTranslated) {
        translateButton.textContent = `Translate to ${currentConfig.targetLanguage}`;
      }
      return; // Button already exists
    }
    
    console.log('Offline Translator: Lyrics content found, adding translate button.');
    const currentConfig = await context.getConfig();

    translateButton = document.createElement('button');
    translateButton.id = 'translate-lyrics-button';
    translateButton.textContent = `Translate to ${currentConfig.targetLanguage}`;

    translateButton.addEventListener('click', async () => {
      const latestConfig = await context.getConfig(); // Re-fetch config on click
      if (!lyricsContentElement) return;

      if (!isTranslated) {
        if (originalLyricsHTML === null) { // Store original only if not already stored
          originalLyricsHTML = lyricsContentElement.innerHTML;
        }
        translateButton.textContent = 'Translating...';
        translateButton.disabled = true;

        try {
          const textToTranslate = lyricsContentElement.textContent || "";
          const result = await ipcRenderer.invoke('translateText', {
            text: textToTranslate,
            sourceLanguageCode: 'eng_Latn', // Hardcoded for now
            targetLanguageCode: latestConfig.targetLanguage,
          });

          if (result.error) {
            console.error('Offline Translator: Error from main -', result.error);
            if (result.error.includes('model failed to load')) {
              translateButton.textContent = 'Translator Unavailable';
              translateButton.disabled = true; // Permanently disable or until app restart
              displayTemporaryMessage(lyricsContentElement, originalLyricsHTML, `Error: ${result.error}`, 5000);
            } else if (result.error.includes('still loading')) {
              translateButton.textContent = `Translate to ${latestConfig.targetLanguage}`;
              translateButton.disabled = false;
              displayTemporaryMessage(lyricsContentElement, originalLyricsHTML, `Warning: ${result.error}`, 3000);
            } else { // General translation error
              translateButton.textContent = `Translate to ${latestConfig.targetLanguage}`;
              translateButton.disabled = false;
              isTranslated = false;
              displayTemporaryMessage(lyricsContentElement, originalLyricsHTML, `Error: ${result.error}`, 5000);
            }
          } else if (result.translatedText) {
            lyricsContentElement.innerHTML = result.translatedText.replace(/\n/g, '<br>');
            translateButton.textContent = 'Show Original';
            isTranslated = true;
          } else { // Unexpected: no error, no text
            translateButton.textContent = `Translate to ${latestConfig.targetLanguage}`;
            translateButton.disabled = false;
            isTranslated = false;
            displayTemporaryMessage(lyricsContentElement, originalLyricsHTML, 'Error: Unknown translation issue.', 5000);
          }
        } catch (error) { // IPC call itself failed
          console.error('Offline Translator: Translation IPC error:', error);
          const ipcError = error as Error;
          translateButton.textContent = `Translate to ${latestConfig.targetLanguage}`;
          translateButton.disabled = false;
          isTranslated = false;
          displayTemporaryMessage(lyricsContentElement, originalLyricsHTML, `Error: ${ipcError.message}`, 5000);
        } finally {
          // For "Translator Unavailable", disabled state is handled above.
          // For "still loading", button is re-enabled.
          // For translation success/failure, button is re-enabled or state changed.
          if (translateButton.textContent !== 'Translator Unavailable' && translateButton.textContent !== 'Show Original') {
             translateButton.disabled = false;
          }
        }
      } else { // Clicked "Show Original"
        if (originalLyricsHTML !== null) {
          lyricsContentElement.innerHTML = originalLyricsHTML;
        }
        translateButton.textContent = `Translate to ${latestConfig.targetLanguage}`;
        isTranslated = false;
        // originalLyricsHTML = null; // Clear stored HTML if we don't want to re-translate without fresh lyrics
                                  // Keeping it allows re-translation of the same original text
      }
    });

    const messageRendererFooter = lyricsContainer.querySelector('#footer');
    if (messageRendererFooter) {
      messageRendererFooter.appendChild(translateButton);
    } else {
      lyricsContainer.appendChild(translateButton);
    }
  };

  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        const lyricsPage = lyricsTabRenderer.querySelector('[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"]');
        if (lyricsPage) {
          setupTranslator(lyricsPage);
        } else {
          isTranslated = false;
          originalLyricsHTML = null; // Reset when lyrics page is gone
          // Any existing button will be removed with the lyrics page.
        }
      }
    }
  });

  observer.observe(lyricsTabRenderer, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['page-type']
  });

  const initialLyricsPage = lyricsTabRenderer.querySelector('[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"]');
  if (initialLyricsPage) {
    setupTranslator(initialLyricsPage);
  }
};
