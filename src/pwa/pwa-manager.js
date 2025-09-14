// PWA Installation and Management Script
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isServiceWorkerRegistered = false;

    this.init();
  }

  async init() {
    this.checkInstallation();
    this.registerServiceWorker();
    this.setupEventListeners();
    this.createInstallPrompt();
  }

  checkInstallation() {
    // Check if running as PWA
    this.isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');

    console.log(
      '[PWA] Installation status:',
      this.isInstalled ? 'Installed' : 'Not installed',
    );
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[PWA] Service Worker registered:', registration);
        this.isServiceWorkerRegistered = true;

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              this.showUpdateAvailable();
            }
          });
        });

        // Check for updates
        registration.update();
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    } else {
      console.warn('[PWA] Service Workers not supported');
    }
  }

  setupEventListeners() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('[PWA] Install prompt available');
      event.preventDefault();
      this.deferredPrompt = event;
      this.showInstallButton();
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      this.deferredPrompt = null;
      this.showInstalledMessage();
    });

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.showConnectionStatus('online');
    });

    window.addEventListener('offline', () => {
      this.showConnectionStatus('offline');
    });
  }

  createInstallPrompt() {
    // Create install button if not already installed
    if (!this.isInstalled && !document.getElementById('pwa-install-btn')) {
      const installButton = document.createElement('button');
      installButton.id = 'pwa-install-btn';
      installButton.textContent = '📱 Install App';
      installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #ff0000;
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
        z-index: 10000;
        display: none;
        transition: all 0.3s ease;
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
        this.installApp();
      });

      document.body.appendChild(installButton);
    }
  }

  showInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton && !this.isInstalled) {
      installButton.style.display = 'block';

      // Animate in
      setTimeout(() => {
        installButton.style.opacity = '1';
        installButton.style.transform = 'translateY(0)';
      }, 100);
    }
  }

  hideInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  async installApp() {
    if (!this.deferredPrompt) {
      console.warn('[PWA] No install prompt available');
      return;
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();

      // Wait for user response
      const { outcome } = await this.deferredPrompt.userChoice;

      console.log('[PWA] Install prompt result:', outcome);

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }

      this.deferredPrompt = null;
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
    }
  }

  showInstalledMessage() {
    this.showToast('✅ YouTube Music installed successfully!', 'success');
  }

  showUpdateAvailable() {
    const updateNotification = this.createUpdateNotification();
    document.body.appendChild(updateNotification);
  }

  createUpdateNotification() {
    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10001;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span>🔄</span>
        <div>
          <div style="font-weight: bold; margin-bottom: 4px;">Update Available</div>
          <div style="font-size: 12px; opacity: 0.8;">A new version is ready to install</div>
        </div>
      </div>
      <div style="margin-top: 12px; display: flex; gap: 8px;">
        <button id="pwa-update-btn" style="background: #ff0000; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Update</button>
        <button id="pwa-dismiss-btn" style="background: transparent; color: white; border: 1px solid #666; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Later</button>
      </div>
    `;

    // Add event listeners
    notification
      .querySelector('#pwa-update-btn')
      .addEventListener('click', () => {
        this.updateApp();
        notification.remove();
      });

    notification
      .querySelector('#pwa-dismiss-btn')
      .addEventListener('click', () => {
        notification.remove();
      });

    return notification;
  }

  async updateApp() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      }
    }
  }

  showConnectionStatus(status) {
    const isOnline = status === 'online';
    const message = isOnline ? '✅ Back online' : '⚠️ You are offline';
    const type = isOnline ? 'success' : 'warning';

    this.showToast(message, type);
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10002;
      animation: fadeInUp 0.3s ease;
    `;

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOutDown 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Utility methods for other parts of the app
  async shareContent(data) {
    if (navigator.share) {
      try {
        await navigator.share(data);
        console.log('[PWA] Content shared successfully');
      } catch (error) {
        console.error('[PWA] Share failed:', error);
        this.fallbackShare(data);
      }
    } else {
      this.fallbackShare(data);
    }
  }

  fallbackShare(data) {
    // Fallback sharing method
    if (navigator.clipboard) {
      navigator.clipboard.writeText(data.url || data.text || '');
      this.showToast('📋 Copied to clipboard');
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('[PWA] Notification permission:', permission);
      return permission === 'granted';
    }
    return false;
  }

  showNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/assets/youtube-music.png',
        badge: '/assets/youtube-music-tray.png',
        ...options,
      });

      return notification;
    }
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeInUp {
    from {
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeOutDown {
    from {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    to {
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize PWA Manager
let pwaManager;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    pwaManager = new PWAManager();
  });
} else {
  pwaManager = new PWAManager();
}

// Export for use in other scripts
window.PWAManager = PWAManager;
window.pwaManager = pwaManager;
