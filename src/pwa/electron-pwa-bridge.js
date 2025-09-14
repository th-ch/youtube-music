// PWA Integration for YouTube Music Electron App
// This script adds PWA functionality to the YouTube Music web interface

class ElectronPWABridge {
  constructor() {
    this.isElectron = true;
    this.init();
  }

  init() {
    // Add PWA-like functionality to the electron app
    this.addInstallPrompt();
    this.addOfflineSupport();
    this.addShareSupport();
    this.setupMediaSession();
  }

  addInstallPrompt() {
    // Create a mock PWA install experience for users who want to share the app
    const installButton = document.createElement('button');
    installButton.id = 'electron-pwa-share-btn';
    installButton.innerHTML = '📤 Share App';
    installButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 0, 0, 0.9);
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      z-index: 10000;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      opacity: 0.8;
    `;

    installButton.addEventListener('mouseenter', () => {
      installButton.style.opacity = '1';
      installButton.style.transform = 'scale(1.05)';
    });

    installButton.addEventListener('mouseleave', () => {
      installButton.style.opacity = '0.8';
      installButton.style.transform = 'scale(1)';
    });

    installButton.addEventListener('click', () => {
      this.showShareDialog();
    });

    // Only show if not in fullscreen mode
    const checkFullscreen = () => {
      const isFullscreen = document.fullscreenElement || 
                          document.webkitFullscreenElement ||
                          document.mozFullScreenElement;
      installButton.style.display = isFullscreen ? 'none' : 'block';
    };

    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('mozfullscreenchange', checkFullscreen);

    document.body.appendChild(installButton);
  }

  showShareDialog() {
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
      background: #222;
      color: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;

    content.innerHTML = `
      <h2 style="margin-top: 0; color: #ff0000;">Share YouTube Music</h2>
      <p style="margin: 20px 0; line-height: 1.5;">
        Share the YouTube Music Desktop App with others! They can install it as a PWA on their mobile devices 
        or download the desktop version.
      </p>
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 25px 0;">
        <button id="copy-pwa-link" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          📱 Copy PWA Link
        </button>
        <button id="copy-github-link" style="background: #333; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          💻 Copy GitHub Link
        </button>
        <button id="share-native" style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          🔗 Native Share
        </button>
      </div>
      <button id="close-share-dialog" style="background: transparent; color: #ccc; border: 1px solid #555; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
        Close
      </button>
    `;

    dialog.appendChild(content);
    document.body.appendChild(dialog);

    // Event listeners
    content.querySelector('#copy-pwa-link').addEventListener('click', () => {
      this.copyToClipboard('https://th-ch.github.io/youtube-music/', 'PWA link copied!');
    });

    content.querySelector('#copy-github-link').addEventListener('click', () => {
      this.copyToClipboard('https://github.com/th-ch/youtube-music', 'GitHub link copied!');
    });

    content.querySelector('#share-native').addEventListener('click', () => {
      this.nativeShare();
    });

    content.querySelector('#close-share-dialog').addEventListener('click', () => {
      dialog.remove();
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }

  async copyToClipboard(text, successMessage = 'Copied!') {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast(successMessage);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showToast(successMessage);
    }
  }

  async nativeShare() {
    const shareData = {
      title: 'YouTube Music Desktop App',
      text: 'Check out this awesome YouTube Music desktop app with PWA support!',
      url: 'https://github.com/th-ch/youtube-music'
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback to copying
      this.copyToClipboard(`${shareData.title}\n${shareData.text}\n${shareData.url}`, 'Share info copied!');
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 5px;
      z-index: 10002;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  addOfflineSupport() {
    // Monitor online/offline status
    const updateOnlineStatus = () => {
      const status = navigator.onLine ? 'online' : 'offline';
      const message = navigator.onLine ? '✅ Back online' : '⚠️ You are offline';
      
      if (!navigator.onLine) {
        this.showToast(message);
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  addShareSupport() {
    // Add share buttons to songs (if not already present)
    const addShareButton = (container) => {
      if (container.querySelector('.pwa-share-btn')) return;

      const shareBtn = document.createElement('button');
      shareBtn.className = 'pwa-share-btn';
      shareBtn.innerHTML = '🔗';
      shareBtn.title = 'Share this song';
      shareBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        margin-left: 8px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
      `;

      shareBtn.addEventListener('mouseenter', () => {
        shareBtn.style.opacity = '1';
      });

      shareBtn.addEventListener('mouseleave', () => {
        shareBtn.style.opacity = '0.7';
      });

      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.shareSong();
      });

      container.appendChild(shareBtn);
    };

    // Observe for player changes
    const observer = new MutationObserver(() => {
      const playerBar = document.querySelector('.ytmusic-player-bar');
      if (playerBar) {
        addShareButton(playerBar);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  shareSong() {
    const titleElement = document.querySelector('.title.ytmusic-player-bar');
    const artistElement = document.querySelector('.byline.ytmusic-player-bar');
    const title = titleElement?.textContent || 'Unknown Title';
    const artist = artistElement?.textContent || 'Unknown Artist';

    const shareData = {
      title: `${title} - ${artist}`,
      text: `Currently listening to "${title}" by ${artist} on YouTube Music`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      this.copyToClipboard(`${shareData.title}\n${shareData.url}`, 'Song info copied!');
    }
  }

  setupMediaSession() {
    // Enhanced media session for PWA-like behavior
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        document.querySelector('[data-id="play-pause-button"]')?.click();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        document.querySelector('[data-id="play-pause-button"]')?.click();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        document.querySelector('.previous-button')?.click();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        document.querySelector('.next-button')?.click();
      });

      // Update media session when song changes
      const updateMediaSession = () => {
        const title = document.querySelector('.title.ytmusic-player-bar')?.textContent || '';
        const artist = document.querySelector('.byline.ytmusic-player-bar')?.textContent || '';
        const artwork = document.querySelector('.image.ytmusic-player-bar img')?.src || '';

        if (title && artist) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            artwork: artwork ? [{ src: artwork, sizes: '512x512', type: 'image/jpeg' }] : []
          });
        }
      };

      const observer = new MutationObserver(updateMediaSession);
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ElectronPWABridge();
  });
} else {
  new ElectronPWABridge();
}
