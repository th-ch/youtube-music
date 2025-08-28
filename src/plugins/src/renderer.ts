import { createRenderer } from '@/utils';
import type { FontCustomizerConfig } from './types';

// Helper to inject a Google Font <link> tag into the document head
function injectGoogleFont(doc: Document, family: string) {
  if (family === 'System Default' || doc.querySelector<HTMLLinkElement>(`link[data-font-family="${CSS.escape(family)}"]`)) {
    return;
  }
  
  const link = doc.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
  link.setAttribute('data-font-family', family);
  doc.head.appendChild(link);
}

// Helper to set a CSS custom property (variable) on the root element
function setCssVar(name: string, value: string | null) {
  const root = document.documentElement;
  if (!value || value === 'System Default') {
    root.style.removeProperty(name);
  } else {
    root.style.setProperty(name, `"${value}", sans-serif`);
  }
}

// Clears all font variables to ensure a clean slate on config changes
function clearAllFontVars() {
  const root = document.documentElement;
  root.style.removeProperty('--ytmusic-font-global');
  root.style.removeProperty('--ytmusic-font-primary');
  root.style.removeProperty('--ytmusic-font-header');
  root.style.removeProperty('--ytmusic-font-title');
  root.style.removeProperty('--ytmusic-font-artist');
  root.style.removeProperty('--ytmusic-font-lyrics');
  root.style.removeProperty('--ytmusic-font-menu');
}

// The main function to apply the current configuration to the document
function applyConfig(config: FontCustomizerConfig) {
  const doc = document;
  clearAllFontVars();

  if (config.enabled) {
    doc.documentElement.setAttribute('data-font-customizer', 'active');
  } else {
    doc.documentElement.removeAttribute('data-font-customizer');
    return;
  }
  
  if (config.mode === 'simple') {
    injectGoogleFont(doc, config.globalFont);
    setCssVar('--ytmusic-font-global', config.globalFont);
  } else {
    // Advanced mode: inject and set each font type
    injectGoogleFont(doc, config.primaryFont);
    injectGoogleFont(doc, config.headerFont);
    injectGoogleFont(doc, config.titleFont);
    injectGoogleFont(doc, config.artistFont);
    injectGoogleFont(doc, config.lyricsFont);
    injectGoogleFont(doc, config.menuFont);
    
    setCssVar('--ytmusic-font-primary', config.primaryFont);
    setCssVar('--ytmusic-font-header', config.headerFont);
    setCssVar('--ytmusic-font-title', config.titleFont);
    setCssVar('--ytmusic-font-artist', config.artistFont);
    setCssVar('--ytmusic-font-lyrics', config.lyricsFont);
    setCssVar('--ytmusic-font-menu', config.menuFont);
  }
}

// Creates and injects the main <style> tag with all the CSS rules
function ensureScopedStyles() {
  if (document.getElementById('font-customizer-style')) return;

  const style = document.createElement('style');
  style.id = 'font-customizer-style';
  style.textContent = `
    /* 1. Base Font Application (The "Everything Else" Rule) */
    /*
      In Simple Mode, --ytmusic-font-global is set and cascades.
      In Advanced Mode, --ytmusic-font-primary is set and cascades.
      This single rule covers both modes perfectly.
    */
    html[data-font-customizer="active"] body {
      font-family: var(--ytmusic-font-primary, var(--ytmusic-font-global, initial)) !important;
    }

    /* 2. Specific Overrides for Advanced Mode */
    /* These rules only apply if their specific variable is set. Otherwise, they inherit from the body. */

    /* Headers: Large page titles and section headers */
    html[data-font-customizer="active"] ytmusic-shelf-renderer h2.title,
    html[data-font-customizer="active"] .ytmusic-detail-header-renderer .title,
    html[data-font-customizer="active"] ytmusic-header-renderer .title,
    /* Additional header targeting */
    html[data-font-customizer="active"] ytmusic-shelf-renderer .header .title,
    html[data-font-customizer="active"] ytmusic-shelf-renderer .header yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-section-header-renderer .title,
    html[data-font-customizer="active"] .ytmusic-section-header-renderer yt-formatted-string,
    html[data-font-customizer="active"] ytmusic-browse-response .header .title,
    html[data-font-customizer="active"] ytmusic-browse-response .header yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-immersive-header-renderer .title,
    html[data-font-customizer="active"] .ytmusic-immersive-header-renderer yt-formatted-string
    {
      font-family: var(--ytmusic-font-header) !important;
    }

    /* Song/Album/Playlist Titles: Targets the actual content items everywhere. */
    html[data-font-customizer="active"] ytmusic-player-bar .title,
    html[data-font-customizer="active"] #player-page .title,
    html[data-font-customizer="active"] .ytmusic-responsive-list-item-renderer .title .yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-grid-renderer .title .yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-card-shelf-renderer .title,
    html[data-font-customizer="active"] .ytmusic-carousel-shelf-renderer .title,
    html[data-font-customizer="active"] .ytmusic-playlist-shelf-renderer .title,
    /* Additional title targeting for comprehensive coverage */
    html[data-font-customizer="active"] .ytmusic-responsive-list-item-renderer .title yt-simple-endpoint yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-grid-renderer .title yt-simple-endpoint yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-shelf-renderer .title yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-shelf-renderer .title yt-simple-endpoint yt-formatted-string,
    html[data-font-customizer="active"] ytmusic-player-queue-item .title yt-formatted-string,
    html[data-font-customizer="active"] ytmusic-browse-response .title yt-formatted-string,
    html[data-font-customizer="active"] ytmusic-search-response .title yt-formatted-string
    {
      font-family: var(--ytmusic-font-title) !important;
    }

    /* Artist/Bylines: Comprehensive targeting for all artist names and secondary text */
    /* Original selectors for basic artist/byline elements */
    html[data-font-customizer="active"] ytmusic-player-bar .byline,
    html[data-font-customizer="active"] #player-page .byline,
    html[data-font-customizer="active"] .ytmusic-responsive-list-item-renderer .secondary-flex-columns,
    html[data-font-customizer="active"] .ytmusic-grid-renderer .subtitle,
    html[data-font-customizer="active"] .ytmusic-card-shelf-renderer .subtitle,
    html[data-font-customizer="active"] .ytmusic-detail-header-renderer .subtitle,
    
    /* Enhanced targeting for yt-formatted-string within artist containers */
    html[data-font-customizer="active"] .ytmusic-responsive-list-item-renderer .secondary-flex-columns yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-responsive-list-item-renderer .subtitle yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-responsive-list-item-renderer .byline yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-grid-renderer .subtitle yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-grid-renderer .byline yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-card-shelf-renderer .subtitle yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-card-shelf-renderer .byline yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-carousel-shelf-renderer .subtitle yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-carousel-shelf-renderer .byline yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-playlist-shelf-renderer .subtitle yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-playlist-shelf-renderer .byline yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-shelf-renderer .subtitle yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-shelf-renderer .byline yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-shelf-renderer .secondary-flex-columns yt-formatted-string,
    
    /* Clickable artist links with yt-simple-endpoint */
    html[data-font-customizer="active"] .ytmusic-responsive-list-item-renderer yt-simple-endpoint.yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-responsive-list-item-renderer a.yt-simple-endpoint yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-grid-renderer yt-simple-endpoint.yt-formatted-string,
    html[data-font-customizer="active"] .ytmusic-grid-renderer a.yt-simple-endpoint yt-formatted-string,
    html[data-font-customizer="active"] yt-simple-endpoint.style-scope.yt-formatted-string[href*="/channel/"],
    html[data-font-customizer="active"] yt-simple-endpoint.style-scope.yt-formatted-string[href*="/artist/"],
    html[data-font-customizer="active"] a.yt-simple-endpoint.style-scope yt-formatted-string[href*="/channel/"],
    html[data-font-customizer="active"] a.yt-simple-endpoint.style-scope yt-formatted-string[href*="/artist/"],
    
    /* Player queue and additional contexts */
    html[data-font-customizer="active"] ytmusic-player-queue-item .byline,
    html[data-font-customizer="active"] ytmusic-player-queue-item .byline yt-formatted-string,
    html[data-font-customizer="active"] ytmusic-player-queue-item .secondary-flex-columns yt-formatted-string,
    html[data-font-customizer="active"] ytmusic-browse-response .subtitle yt-formatted-string,
    html[data-font-customizer="active"] ytmusic-browse-response .byline yt-formatted-string,
    html[data-font-customizer="active"] ytmusic-browse-response .secondary-flex-columns yt-formatted-string,
    html[data-font-customizer="active"] ytmusic-search-response .subtitle yt-formatted-string,
    html[data-font-customizer="active"] ytmusic-search-response .byline yt-formatted-string,
    html[data-font-customizer="active"] ytmusic-search-response .secondary-flex-columns yt-formatted-string,
    
    /* Catch-all patterns for any remaining artist links */
    html[data-font-customizer="active"] .ytmusic-responsive-list-item-flex-column-renderer .yt-formatted-string:not(.title),
    html[data-font-customizer="active"] .ytmusic-responsive-list-item-flex-column-renderer yt-simple-endpoint yt-formatted-string,
    html[data-font-customizer="active"] .style-scope.yt-formatted-string:not(.title):not(.video-title):not(.header-title),
    html[data-font-customizer="active"] yt-simple-endpoint .style-scope.yt-formatted-string:not(.title):not(.video-title):not(.header-title)
    {
      font-family: var(--ytmusic-font-artist) !important;
    }

    /* Lyrics */
    html[data-font-customizer="active"] #tab-renderer[page-type='MUSIC_PAGE_TYPE_TRACK_LYRICS'] *,
    html[data-font-customizer="active"] #synced-lyrics-container *
    {
      font-family: var(--ytmusic-font-lyrics) !important;
    }

    /* Navigation Menu: Top bar menu items (Plugins, Options, View, etc.) */
    /* Main navigation panel (top bar) */
    html[data-font-customizer="active"] nav[data-ytmd-main-panel],
    html[data-font-customizer="active"] nav[data-ytmd-main-panel] *,
    html[data-font-customizer="active"] [data-ytmd-main-panel],
    html[data-font-customizer="active"] [data-ytmd-main-panel] *,
    html[data-font-customizer="active"] [data-ytmd-main-panel] button,
    html[data-font-customizer="active"] [data-ytmd-main-panel] button *,
    
    /* Dropdown panels that appear when clicking menu buttons */
    html[data-font-customizer="active"] ul[data-ytmd-sub-panel],
    html[data-font-customizer="active"] ul[data-ytmd-sub-panel] *,
    html[data-font-customizer="active"] [data-ytmd-sub-panel],
    html[data-font-customizer="active"] [data-ytmd-sub-panel] *,
    html[data-font-customizer="active"] [data-ytmd-sub-panel] li,
    html[data-font-customizer="active"] [data-ytmd-sub-panel] li *,
    html[data-font-customizer="active"] [data-ytmd-sub-panel] span,
    html[data-font-customizer="active"] [data-ytmd-sub-panel] button,
    html[data-font-customizer="active"] [data-ytmd-sub-panel] button *,
    
    /* Generic panel selectors for fallback */
    html[data-font-customizer="active"] [data-ytmd-panel],
    html[data-font-customizer="active"] [data-ytmd-panel] *,
    html[data-font-customizer="active"] [data-ytmd-panel] button,
    html[data-font-customizer="active"] [data-ytmd-panel] .panel-item,
    html[data-font-customizer="active"] [data-ytmd-panel] .menu-item,
    
    /* Additional YouTube Music menu selectors */
    html[data-font-customizer="active"] ytmusic-menu-popup-renderer,
    html[data-font-customizer="active"] ytmusic-menu-popup-renderer *,
    html[data-font-customizer="active"] ytmusic-menu-navigation-item-renderer,
    html[data-font-customizer="active"] ytmusic-menu-navigation-item-renderer *,
    html[data-font-customizer="active"] .ytmusic-menu-popup-renderer,
    html[data-font-customizer="active"] .ytmusic-menu-popup-renderer *,
    html[data-font-customizer="active"] .menu-item,
    html[data-font-customizer="active"] .text.style-scope.ytmusic-menu-navigation-item-renderer,
    
    /* Context menus and dropdowns */
    html[data-font-customizer="active"] tp-yt-paper-listbox,
    html[data-font-customizer="active"] tp-yt-paper-listbox *,
    html[data-font-customizer="active"] .style-scope.menu-item.ytmusic-menu-popup-renderer
    {
      font-family: var(--ytmusic-font-menu) !important;
    }
  `;
  document.head.appendChild(style);
}

export const renderer = createRenderer<unknown, FontCustomizerConfig>({
  start: async ({ getConfig }) => {
    ensureScopedStyles();
    const cfg = await getConfig();
    applyConfig(cfg);
  },
  onConfigChange: (cfg) => {
    applyConfig(cfg);
  },
});