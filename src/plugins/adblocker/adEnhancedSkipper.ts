/**
 * Enhanced ad skipping with detailed detection and statistics
 */

// Track ad skipping metrics
let skippedAdCount = 0;
let lastSkippedTime = 0;
const skippedAdIds = new Set<string>();

interface AdSkipStats {
  totalSkipped: number;
  uniqueAdsSkipped: number;
  lastSkippedTime: number;
}

/**
 * Skip ad with enhanced detection
 */
function skipAdEnhanced(target: Element): boolean {
  // Try multiple skip button selectors for better coverage
  const skipButtons = [
    'button.ytp-ad-skip-button-modern',
    'button.ytp-ad-skip-button',
    '.videoAdUiSkipButton',
    '[data-tooltip-text*="Skip"]',
    '.ytp-ad-skip-button-slot',
    // Add more selectors for better coverage
    '[class*="skip"]button',
    '[class*="skip-"]button',
    '[aria-label*="Skip"]',
  ];

  // Find any matching skip button
  for (const selector of skipButtons) {
    const skipButton = target.querySelector<HTMLButtonElement>(selector);
    if (skipButton) {
      skipButton.click();
      skippedAdCount++;
      lastSkippedTime = Date.now();

      // Try to extract ad ID for unique counting
      const adElement = target.querySelector('[data-ad-id]');
      if (adElement && adElement.getAttribute('data-ad-id')) {
        skippedAdIds.add(adElement.getAttribute('data-ad-id') || '');
      }

      return true;
    }
  }

  // If we didn't find a skip button, try to detect overlay ads and close them
  const closeButtons = [
    '.ytp-ad-overlay-close-button',
    '.ytp-ad-overlay-close-container',
    '.close-button',
    '[aria-label="Close"]',
    '[aria-label="Close ad"]',
    '[class*="dismiss"]',
    '[class*="close"]button',
  ];

  for (const selector of closeButtons) {
    const closeButton = target.querySelector<HTMLButtonElement>(selector);
    if (closeButton) {
      closeButton.click();
      skippedAdCount++;
      lastSkippedTime = Date.now();
      return true;
    }
  }

  return false;
}

/**
 * Enhance video to speed through ads
 */
function enhanceAdPlayback(
  video: HTMLVideoElement,
  isAdShowing: boolean,
  config: EnhancedAdBlockerConfig
): void {
  if (!video) return;

  if (isAdShowing) {
    // Apply user preference for ad speed
    video.playbackRate = config.adPlaybackSpeed || 16;

    // Control audio based on user preference
    video.muted = config.muteAds !== false;

    // Try to seek to end of ad if very aggressive mode is on
    if (config.aggressiveMode && video.duration > 0) {
      // Leave slightly less time at the end to ensure the ad completes
      const seekTime = Math.max(video.duration - 0.3, video.currentTime);

      // Skip to end of video
      video.currentTime = seekTime;

      // Also attempt to find and click skip buttons
      const player = video.closest('#movie_player') || document;
      skipAdEnhanced(player as Element);
    }
  } else {
    // Restore normal playback only if we're not in an ad
    if (video.playbackRate > 1) {
      video.playbackRate = 1;
    }

    // Unmute only if we're not in an ad and muting was because of an ad
    if (config.muteAds !== false && video.muted) {
      video.muted = false;
    }
  }
}

/**
 * Create visual ad-blocking indicator
 */
function createAdBlockingIndicator(): HTMLElement {
  const indicator = document.createElement('div');

  // Style the indicator
  Object.assign(indicator.style, {
    position: 'fixed',
    bottom: '60px',
    right: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#ffffff',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    zIndex: '9999',
    transition: 'opacity 0.3s',
    opacity: '0',
    pointerEvents: 'none',
  });

  document.body.appendChild(indicator);
  return indicator;
}

/**
 * Update the indicator with current stats
 */
function updateAdBlockingIndicator(
  indicator: HTMLElement,
  isAdBlocking: boolean,
  stats: AdSkipStats
): void {
  if (isAdBlocking) {
    indicator.textContent = `Blocking ad...`;
    indicator.style.opacity = '1';
    indicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';

    // Hide after 2 seconds
    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 2000);
  } else if (
    stats.lastSkippedTime > 0 &&
    Date.now() - stats.lastSkippedTime < 3000
  ) {
    // Show skipped message briefly
    indicator.textContent = `Ad skipped (Total: ${stats.totalSkipped})`;
    indicator.style.opacity = '1';
    indicator.style.backgroundColor = 'rgba(0, 128, 0, 0.7)';

    // Hide after 2 seconds
    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 2000);
  }
}

/**
 * Get current ad skipping statistics
 */
export function getAdSkipStats(): AdSkipStats {
  return {
    totalSkipped: skippedAdCount,
    uniqueAdsSkipped: skippedAdIds.size,
    lastSkippedTime,
  };
}

// Configuration interface for enhanced ad blocker
export interface EnhancedAdBlockerConfig {
  adPlaybackSpeed?: number;
  muteAds?: boolean;
  showIndicator?: boolean;
  aggressiveMode?: boolean;
}

// Default configuration
const defaultConfig: EnhancedAdBlockerConfig = {
  adPlaybackSpeed: 16,
  muteAds: true,
  showIndicator: true,
  aggressiveMode: false,
};

/**
 * Load enhanced ad skipping functionality
 */
export const loadEnhancedAdSkipper = (
  userConfig?: Partial<EnhancedAdBlockerConfig>
): void => {
  // Merge default config with user config
  const config = { ...defaultConfig, ...userConfig };

  // Get player element
  const player = document.querySelector('#movie_player');
  if (!player) return;

  // Create indicator if enabled
  const indicator = config.showIndicator ? createAdBlockingIndicator() : null;

  // Function to check if player contains an ad
  const isPlayerShowingAd = (player: Element): boolean => {
    return (
      player.classList.contains('ad-showing') ||
      player.classList.contains('ad-interrupting') ||
      !!player.querySelector('.ytp-ad-player-overlay') ||
      !!player.querySelector('.ytp-ad-module') ||
      !!player.querySelector('[id*="ad-"]') ||
      !!player.querySelector('[class*="ad-"]')
    );
  };

  // Set up observer to detect ad state changes
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'class'
      ) {
        const target = mutation.target as HTMLElement;

        // Check for ad showing state
        const isAdShowing = isPlayerShowingAd(target);

        // Get video element
        const video = target.querySelector<HTMLVideoElement>('video');

        // Apply speed and muting changes
        if (video) {
          enhanceAdPlayback(video, isAdShowing, config);
        }

        // Update visual indicator
        if (indicator && isAdShowing) {
          updateAdBlockingIndicator(indicator, isAdShowing, getAdSkipStats());
        }
      }

      // Look for skip button when DOM changes
      if (
        mutation.type === 'childList' &&
        mutation.addedNodes.length &&
        mutation.target instanceof HTMLElement
      ) {
        const didSkip = skipAdEnhanced(mutation.target);

        // Update indicator after skipping
        if (indicator && didSkip) {
          updateAdBlockingIndicator(indicator, false, getAdSkipStats());
        }
      }
    }

    // More aggressive checking for ad elements
    const isAdShowing = isPlayerShowingAd(player);

    // Find the video element
    const video = player.querySelector<HTMLVideoElement>('video');

    // Apply enhanced playback settings
    if (video) {
      enhanceAdPlayback(video, isAdShowing, config);
    }

    // Update visual indicator
    if (indicator && isAdShowing) {
      updateAdBlockingIndicator(indicator, isAdShowing, getAdSkipStats());
    }
  }).observe(player, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
  });

  // Add a direct event listener for timeupdate to catch ads in real-time
  const video = player.querySelector<HTMLVideoElement>('video');
  if (video) {
    video.addEventListener('timeupdate', () => {
      const isAdShowing = isPlayerShowingAd(player);
      if (isAdShowing) {
        enhanceAdPlayback(video, isAdShowing, config);
        if (indicator) {
          updateAdBlockingIndicator(indicator, isAdShowing, getAdSkipStats());
        }
      }
    });
  }

  // Check initial state
  const isAdShowing = isPlayerShowingAd(player);

  if (video) {
    enhanceAdPlayback(video, isAdShowing, config);
  }

  skipAdEnhanced(player);

  // Set up periodic ad checking as a fallback
  setInterval(() => {
    if (player) {
      const isAdCurrentlyShowing = isPlayerShowingAd(player);
      if (isAdCurrentlyShowing) {
        skipAdEnhanced(player);

        const video = player.querySelector<HTMLVideoElement>('video');
        if (video) {
          enhanceAdPlayback(video, true, config);
        }

        if (indicator) {
          updateAdBlockingIndicator(indicator, true, getAdSkipStats());
        }
      }
    }
  }, 1000);
};

// Reset the ad skip counter
export const resetAdSkipStats = (): void => {
  skippedAdCount = 0;
  lastSkippedTime = 0;
  skippedAdIds.clear();
};
