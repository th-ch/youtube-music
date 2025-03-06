/* eslint-disable */

// Enhanced YouTube Music Ad Blocker injector
// Builds upon the original inject.js but adds more comprehensive ad detection

let injected = false;

export const isInjected = () => injected;

/**
 * @param {Electron.ContextBridge} contextBridge
 */
export const inject = (contextBridge) => {
  injected = true;
  {
    // Enhanced pruner that handles more ad-related fields
    const pruner = function (o) {
      // Skip processing if not an object
      if (!o || typeof o !== 'object') return o;

      // Process existing properties to remove ads
      delete o.playerAds;
      delete o.adPlacements;
      delete o.adSlots;
      delete o.adBreakHeartbeatParams;
      delete o.adParams;
      delete o.adPlaybackContext;
      delete o.adsSelfMonitoringContext;
      delete o.adSignalsInfo;
      delete o.breakoutRequests;

      // Handle nested playerResponse object
      if (o.playerResponse) {
        delete o.playerResponse.playerAds;
        delete o.playerResponse.adPlacements;
        delete o.playerResponse.adSlots;
        delete o.playerResponse.adBreakHeartbeatParams;

        // Handle adBreakHeartbeatParams
        if (o.playerResponse.adBreakHeartbeatParams) {
          o.playerResponse.adBreakHeartbeatParams = {};
        }

        // Remove auxiliary ad-related data
        if (o.playerResponse.auxiliaryUi) {
          const messageRenderers =
            o.playerResponse.auxiliaryUi?.messageRenderers;

          if (messageRenderers?.offerMessageRenderer) {
            delete messageRenderers.offerMessageRenderer;
          }
        }
      }

      // Handle initial player response object
      if (o.ytInitialPlayerResponse) {
        delete o.ytInitialPlayerResponse.playerAds;
        delete o.ytInitialPlayerResponse.adPlacements;
        delete o.ytInitialPlayerResponse.adSlots;

        // Handle auxiliary UI that might contain ads
        if (o.ytInitialPlayerResponse.auxiliaryUi) {
          const messageRenderers =
            o.ytInitialPlayerResponse.auxiliaryUi?.messageRenderers;

          if (messageRenderers?.offerMessageRenderer) {
            delete messageRenderers.offerMessageRenderer;
          }
        }

        // Remove ad breaks
        if (o.ytInitialPlayerResponse.streamingData) {
          delete o.ytInitialPlayerResponse.streamingData.adBreakTimings;
        }
      }

      // Clear preroll ads
      if (o.response?.adPlacements) {
        o.response.adPlacements = [];
      }

      // Process items array - used in search results and playlists
      if (Array.isArray(o.items)) {
        // Filter out promoted content
        o.items = o.items.filter(
          (item) =>
            !item.promotedContent &&
            !item.promoted &&
            !item.adInfo &&
            !(
              item.badges &&
              item.badges.some(
                (b) =>
                  b.metadataBadgeRenderer &&
                  b.metadataBadgeRenderer.label === 'Ad'
              )
            )
        );
      }

      return o;
    };

    contextBridge.exposeInMainWorld('_enhancedPruner', pruner);
  }

  // Expose a hook for removing ad-related DOM elements
  contextBridge.exposeInMainWorld('_removeAdElements', () => {
    // Elements that might contain ads
    const adSelectors = [
      '.ytd-display-ad-renderer',
      '.ytd-promoted-video-renderer',
      '.ytd-promoted-sparkles-web-renderer',
      '.ytd-player-legacy-desktop-watch-ads-renderer',
      '.ytp-ad-overlay-container',
      '.ytp-ad-message-container',
      'ytd-in-feed-ad-layout-renderer',
      '.masthead-ad',
      '.ytd-video-masthead-ad-v3-renderer',
      '.ytd-mealbar-promo-renderer',
    ];

    // Remove all ad elements
    adSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => element.remove());
    });
  });

  // Setup MutationObserver to clean ads from DOM
  contextBridge.exposeInMainWorld('_setupAdDomCleaner', () => {
    // Remove all ad elements initially
    window._removeAdElements();

    // Setup observer to remove ad elements as they appear
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          window._removeAdElements();
        }
      }
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return observer;
  });
};
