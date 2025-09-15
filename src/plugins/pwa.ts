import { createPlugin } from '@/utils';
import { t } from '@/i18n';

import type { PluginConfig } from '@/types/plugins';

export interface PWAPluginConfig extends PluginConfig {
  enableInstallPrompt: boolean;
  enableShareButton: boolean;
  enableOfflineSupport: boolean;
  enableMediaSession: boolean;
}

export default createPlugin({
  name: () => t('plugins.pwa.name'),
  description: () => t('plugins.pwa.description'),
  restartNeeded: false,
  config: {
    enableInstallPrompt: true,
    enableShareButton: true,
    enableOfflineSupport: true,
    enableMediaSession: true,
  } as PWAPluginConfig,
  renderer: {
    async onPlayerApiReady(_api, { getConfig }) {
      const config = await getConfig();

      // PWA Integration
      if (config.enableInstallPrompt) {
        addInstallPrompt();
      }

      if (config.enableShareButton) {
        addShareButton();
      }

      if (config.enableOfflineSupport) {
        addOfflineSupport();
      }

      if (config.enableMediaSession) {
        enhanceMediaSession();
      }

      function addInstallPrompt() {
        // Create PWA-style install prompt
        const installButton = document.createElement('button');
        installButton.id = 'pwa-install-btn';
        installButton.innerHTML = '📱 Install PWA';
        installButton.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #ff0000, #cc0000);
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 25px;
          cursor: pointer;
          font-size: 13px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
          z-index: 10000;
          display: none;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        `;

        installButton.addEventListener('mouseenter', () => {
          installButton.style.transform = 'scale(1.05)';
          installButton.style.boxShadow = '0 6px 16px rgba(255, 0, 0, 0.4)';
        });

        installButton.addEventListener('mouseleave', () => {
          installButton.style.transform = 'scale(1)';
          installButton.style.boxShadow = '0 4px 12px rgba(255, 0, 0, 0.3)';
        });

        installButton.addEventListener('click', () => {
          showInstallDialog();
        });

        document.body.appendChild(installButton);

        // Show button after delay
        setTimeout(() => {
          installButton.style.display = 'block';
        }, 3000);
      }

      function showInstallDialog() {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          backdrop-filter: blur(5px);
        `;

        const content = document.createElement('div');
        content.style.cssText = `
          background: #1a1a1a;
          color: white;
          padding: 30px;
          border-radius: 12px;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          border: 1px solid #333;
        `;

        content.innerHTML = `
          <h2 style="margin-top: 0; color: #ff0000; font-size: 24px;">📱 Install as PWA</h2>
          <p style="margin: 20px 0; line-height: 1.6; color: #ccc;">
            While you're using the desktop app, you can also install YouTube Music as a 
            Progressive Web App on your mobile devices for the best mobile experience!
          </p>
          <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ff0000; font-size: 16px;">🌐 Mobile PWA Features:</h3>
            <ul style="text-align: left; color: #ddd; padding-left: 20px;">
              <li>✓ Native app-like experience</li>
              <li>✓ Offline support for docs</li>
              <li>✓ Push notifications</li>
              <li>✓ Home screen installation</li>
              <li>✓ Fast loading times</li>
            </ul>
          </div>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 25px 0;">
            <button id="copy-pwa-link" style="background: #4CAF50; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
              📱 Copy PWA Link
            </button>
            <button id="open-docs" style="background: #2196F3; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
              📖 Open Docs Site
            </button>
            <button id="share-app" style="background: #9C27B0; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
              🔗 Share App
            </button>
          </div>
          <button id="close-pwa-dialog" style="background: transparent; color: #999; border: 1px solid #555; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 15px;">
            Close
          </button>
        `;

        dialog.appendChild(content);
        document.body.appendChild(dialog);

        // Event listeners
        const copyPwaBtn = content.querySelector('#copy-pwa-link');
        const openDocsBtn = content.querySelector('#open-docs');
        const shareAppBtn = content.querySelector('#share-app');
        const closeBtn = content.querySelector('#close-pwa-dialog');

        copyPwaBtn?.addEventListener('click', () => {
          copyToClipboard(
            'https://th-ch.github.io/youtube-music/',
            '📱 PWA link copied to clipboard!',
          );
        });

        openDocsBtn?.addEventListener('click', () => {
          window.open('https://th-ch.github.io/youtube-music/', '_blank');
          dialog.remove();
        });

        shareAppBtn?.addEventListener('click', () => {
          shareApp();
        });

        closeBtn?.addEventListener('click', () => {
          dialog.remove();
        });

        dialog.addEventListener('click', (e) => {
          if (e.target === dialog) {
            dialog.remove();
          }
        });
      }

      function addShareButton() {
        // Add share button to player controls
        const observer = new MutationObserver(() => {
          const playerBar = document.querySelector(
            '.middle-controls-buttons.ytmusic-player-bar',
          );
          if (playerBar && !playerBar.querySelector('.pwa-share-btn')) {
            const shareBtn = document.createElement('button');
            shareBtn.className = 'pwa-share-btn';
            shareBtn.innerHTML = '🔗';
            shareBtn.title = 'Share this song';
            shareBtn.style.cssText = `
              background: none;
              border: none;
              color: var(--ytmusic-text-secondary);
              font-size: 20px;
              cursor: pointer;
              padding: 8px;
              margin: 0 4px;
              opacity: 0.7;
              transition: opacity 0.2s ease, transform 0.2s ease;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
            `;

            shareBtn.addEventListener('mouseenter', () => {
              shareBtn.style.opacity = '1';
              shareBtn.style.transform = 'scale(1.1)';
              shareBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });

            shareBtn.addEventListener('mouseleave', () => {
              shareBtn.style.opacity = '0.7';
              shareBtn.style.transform = 'scale(1)';
              shareBtn.style.backgroundColor = 'transparent';
            });

            shareBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              shareCurrentSong();
            });

            playerBar.appendChild(shareBtn);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }

      function addOfflineSupport() {
        // Monitor connection status
        function updateConnectionStatus() {
          const isOnline = navigator.onLine;
          const statusIndicator =
            document.getElementById('pwa-connection-status') ||
            createConnectionIndicator();
          statusIndicator.textContent = isOnline ? '🟢' : '🔴';
          statusIndicator.title = isOnline ? 'Online' : 'Offline';
          statusIndicator.style.color = isOnline ? '#4CAF50' : '#F44336';
          if (!isOnline) {
            showToast('⚠️ You are offline. Some features may be limited.');
          }
        }

        function createConnectionIndicator() {
          const indicator = document.createElement('div');
          indicator.id = 'pwa-connection-status';
          indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            font-size: 12px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.7);
            padding: 4px 8px;
            border-radius: 12px;
            color: white;
            font-weight: bold;
          `;
          document.body.appendChild(indicator);
          return indicator;
        }

        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);
        updateConnectionStatus();
      }

      function enhanceMediaSession() {
        if ('mediaSession' in navigator) {
          // Update media session metadata when song changes
          const updateMediaSession = () => {
            const titleElement = document.querySelector(
              '.title.ytmusic-player-bar',
            );
            const artistElement = document.querySelector(
              '.byline.ytmusic-player-bar',
            );
            const artworkElement = document.querySelector(
              '.image.ytmusic-player-bar img',
            ) as HTMLImageElement;
            if (titleElement && artistElement) {
              const title = titleElement.textContent || '';
              const artist = artistElement.textContent || '';
              const artwork = artworkElement?.src || '';

              navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: artist,
                album: 'YouTube Music',
                artwork: artwork
                  ? [
                      { src: artwork, sizes: '96x96', type: 'image/jpeg' },
                  { src: artwork, sizes: '128x128', type: 'image/jpeg' },
                  { src: artwork, sizes: '192x192', type: 'image/jpeg' },
                      { src: artwork, sizes: '256x256', type: 'image/jpeg' },
                      { src: artwork, sizes: '384x384', type: 'image/jpeg' },
                  { src: artwork, sizes: '512x512', type: 'image/jpeg' }
                ] : []
              });
            }
          };

          // Observe for song changes
          const observer = new MutationObserver(updateMediaSession);
          observer.observe(document.body, {
            childList: true,
            subtree: true,
          });

          // Initial update
          updateMediaSession();
        }
      }

      function shareCurrentSong() {
        const titleElement = document.querySelector('.title.ytmusic-player-bar');
        const artistElement = document.querySelector(
          '.byline.ytmusic-player-bar',
        );
        const title = titleElement?.textContent || 'Unknown Title';
        const artist = artistElement?.textContent || 'Unknown Artist';

        const shareData = {
          title: `${title} - ${artist}`,
          text: `🎵 Currently listening to "${title}" by ${artist} on YouTube Music`,
          url: window.location.href,
        };

        if (navigator.share) {
          navigator.share(shareData).catch(() => {
            fallbackShare(shareData);
          });
        } else {
          fallbackShare(shareData);
        }
      }

      function shareApp() {
        const shareData = {
          title: 'YouTube Music Desktop App',
          text: '🎵 Check out this amazing YouTube Music desktop app with PWA support!',
          url: 'https://github.com/th-ch/youtube-music',
        };

        if (navigator.share) {
          navigator.share(shareData).catch(() => {
            fallbackShare(shareData);
          });
        } else {
          fallbackShare(shareData);
        }
      }

      function fallbackShare(data: {
        title: string;
        text: string;
        url: string;
      }) {
        copyToClipboard(
          `${data.title}\n${data.text}\n${data.url}`,
          '📋 Share info copied to clipboard!',
        );
      }

      function copyToClipboard(text: string, successMessage = 'Copied!') {
        if (navigator.clipboard) {
          navigator.clipboard
            .writeText(text)
            .then(() => {
              showToast(successMessage);
            })
            .catch(() => {
              fallbackCopy(text, successMessage);
            });
        } else {
          fallbackCopy(text, successMessage);
        }
      }

      function fallbackCopy(text: string, successMessage: string) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast(successMessage);
      }

      function showToast(message: string) {
        const toast = document.createElement('div');
        toast.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 14px;
          z-index: 10002;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
          toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(-50%) translateY(20px)';
          setTimeout(() => toast.remove(), 300);
        }, 3000);
      }
    },

    async onConfigChange(newConfig) {
      const config = newConfig;

      // Update features based on config changes
      if (config.enableInstallPrompt) {
        const existingBtn = document.getElementById('pwa-install-btn');
        if (!existingBtn) {
          // Re-initialize install prompt if needed
          console.log('PWA: Install prompt re-enabled');
        }
      } else {
        const existingBtn = document.getElementById('pwa-install-btn');
        if (existingBtn) {
          existingBtn.remove();
        }
      }
    }
  }
});
