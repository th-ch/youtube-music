import style from './style.css?inline';
import { createPlugin } from '@/utils';

interface SongInfo {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  element: HTMLElement;
  playlistId?: string;
  isLiked?: boolean;
}

interface DuplicateGroup {
  original: SongInfo;
  duplicates: SongInfo[];
  similarity: number;
}

export default createPlugin({
  name: 'Duplicate Finder',
  restartNeeded: false,
  config: {
    enabled: false,
    scanLibrary: true,
    scanPlaylists: true,
    scanLikedSongs: true,
    similarityThreshold: 85, // Percentage similarity threshold
    autoRemove: false,
    showNotification: true,
  },
  stylesheets: [style],
  
  menu: async ({ getConfig, setConfig }) => {
    const config = await getConfig();
    return [
      {
        label: 'Duplicate Finder',
        submenu: [
          {
            label: 'Scan for Duplicates',
            click() {
              // Trigger scan via IPC
              window.postMessage({ type: 'DUPLICATE_FINDER_SCAN' }, '*');
            },
          },
          {
            label: 'Settings',
            submenu: [
              {
                label: 'Scan Library',
                type: 'checkbox',
                checked: config.scanLibrary,
                click() {
                  setConfig({ scanLibrary: !config.scanLibrary });
                },
              },
              {
                label: 'Scan Playlists',
                type: 'checkbox',
                checked: config.scanPlaylists,
                click() {
                  setConfig({ scanPlaylists: !config.scanPlaylists });
                },
              },
              {
                label: 'Scan Liked Songs',
                type: 'checkbox',
                checked: config.scanLikedSongs,
                click() {
                  setConfig({ scanLikedSongs: !config.scanLikedSongs });
                },
              },
              {
                label: 'Auto Remove Duplicates',
                type: 'checkbox',
                checked: config.autoRemove,
                click() {
                  setConfig({ autoRemove: !config.autoRemove });
                },
              },
              {
                type: 'separator',
              },
              {
                label: 'Similarity Threshold',
                submenu: [70, 80, 85, 90, 95].map((threshold) => ({
                  label: `${threshold}%`,
                  type: 'radio',
                  checked: config.similarityThreshold === threshold,
                  click() {
                    setConfig({ similarityThreshold: threshold });
                  },
                })),
              },
            ],
          },
          {
            type: 'separator',
          },
          {
            label: 'Show Results Panel',
            click() {
              window.postMessage({ type: 'DUPLICATE_FINDER_SHOW_PANEL' }, '*');
            },
          },
        ],
      },
    ];
  },

  backend: {
    start({ ipc }) {
      // Handle scan request from renderer
      ipc.handle('duplicate-finder-scan', async (scanOptions) => {
        return { success: true, message: 'Scan initiated' };
      });

      // Handle duplicate removal
      ipc.handle('duplicate-finder-remove', async (duplicateIds) => {
        return { success: true, removed: duplicateIds.length };
      });
    },

    onConfigChange(newConfig) {
      console.log('Duplicate Finder config changed:', newConfig);
    },

    stop(context) {
      // Cleanup when plugin is disabled
    },
  },

  renderer: {
    async start(context) {
      let duplicateGroups: DuplicateGroup[] = [];
      let isScanning = false;

      // Utility functions
      const normalizeString = (str: string): string => {
        return str
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const calculateSimilarity = (str1: string, str2: string): number => {
        const normalized1 = normalizeString(str1);
        const normalized2 = normalizeString(str2);
        
        if (normalized1 === normalized2) return 100;
        
        // Levenshtein distance based similarity
        const matrix = Array(normalized2.length + 1).fill(null).map(() => 
          Array(normalized1.length + 1).fill(null)
        );
        
        for (let i = 0; i <= normalized1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= normalized2.length; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= normalized2.length; j++) {
          for (let i = 1; i <= normalized1.length; i++) {
            const indicator = normalized1[i - 1] === normalized2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
              matrix[j][i - 1] + 1,
              matrix[j - 1][i] + 1,
              matrix[j - 1][i - 1] + indicator
            );
          }
        }
        
        const distance = matrix[normalized2.length][normalized1.length];
        const maxLength = Math.max(normalized1.length, normalized2.length);
        return Math.round(((maxLength - distance) / maxLength) * 100);
      };

      const extractSongInfo = (element: HTMLElement): SongInfo | null => {
        try {
          const titleEl = element.querySelector('.title') || 
                          element.querySelector('[class*="title"]') ||
                          element.querySelector('a[href*="/watch"]');
          
          const artistEl = element.querySelector('.subtitle') ||
                          element.querySelector('[class*="artist"]') ||
                          element.querySelector('[class*="secondary"]');
          
          const albumEl = element.querySelector('[class*="album"]');
          const durationEl = element.querySelector('[class*="duration"]') ||
                            element.querySelector('time');

          if (!titleEl) return null;

          const title = titleEl.textContent?.trim() || '';
          const artist = artistEl?.textContent?.trim() || 'Unknown Artist';
          const album = albumEl?.textContent?.trim() || '';
          const duration = durationEl?.textContent?.trim() || '';
          
          // Extract ID from href or data attributes
          const id = titleEl.getAttribute('href')?.match(/[?&]v=([^&]+)/)?.[1] ||
                    element.getAttribute('data-video-id') ||
                    Math.random().toString(36).substr(2, 9);

          return {
            id,
            title,
            artist,
            album,
            duration,
            element,
          };
        } catch (error) {
          console.error('Error extracting song info:', error);
          return null;
        }
      };

      const scanForDuplicates = async (): Promise<DuplicateGroup[]> => {
        const config = await context.getConfig();
        const songs: SongInfo[] = [];
        
        // Scan different sections based on config
        const selectors = [
          'ytmusic-responsive-list-item-renderer',
          'ytmusic-two-row-item-renderer',
          '.song-row',
          '[class*="song"]',
          '[class*="track"]'
        ];

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const songInfo = extractSongInfo(el as HTMLElement);
            if (songInfo) songs.push(songInfo);
          });
        }

        // Find duplicates
        const groups: DuplicateGroup[] = [];
        const processed = new Set<string>();

        for (let i = 0; i < songs.length; i++) {
          if (processed.has(songs[i].id)) continue;
          
          const duplicates: SongInfo[] = [];
          
          for (let j = i + 1; j < songs.length; j++) {
            if (processed.has(songs[j].id)) continue;
            
            const titleSimilarity = calculateSimilarity(songs[i].title, songs[j].title);
            const artistSimilarity = calculateSimilarity(songs[i].artist, songs[j].artist);
            const overallSimilarity = (titleSimilarity + artistSimilarity) / 2;
            
            if (overallSimilarity >= config.similarityThreshold) {
              duplicates.push(songs[j]);
              processed.add(songs[j].id);
            }
          }
          
          if (duplicates.length > 0) {
            groups.push({
              original: songs[i],
              duplicates,
              similarity: Math.max(...duplicates.map(d => 
                (calculateSimilarity(songs[i].title, d.title) + 
                 calculateSimilarity(songs[i].artist, d.artist)) / 2
              ))
            });
          }
          
          processed.add(songs[i].id);
        }

        return groups;
      };

      const createResultsPanel = (): HTMLElement => {
        const panel = document.createElement('div');
        panel.id = 'duplicate-finder-panel';
        panel.innerHTML = `
          <div class="duplicate-finder-header">
            <h2>Duplicate Finder Results</h2>
            <button id="close-duplicate-panel">×</button>
          </div>
          <div class="duplicate-finder-stats">
            <span id="duplicate-count">0 duplicates found</span>
            <button id="remove-all-duplicates">Remove All Duplicates</button>
          </div>
          <div id="duplicate-results"></div>
        `;

        const closeBtn = panel.querySelector('#close-duplicate-panel');
        closeBtn?.addEventListener('click', () => {
          panel.remove();
        });

        const removeAllBtn = panel.querySelector('#remove-all-duplicates');
        removeAllBtn?.addEventListener('click', async () => {
          if (confirm('Are you sure you want to remove all duplicates?')) {
            await removeAllDuplicates();
          }
        });

        return panel;
      };

      const displayResults = (groups: DuplicateGroup[]) => {
        const existingPanel = document.getElementById('duplicate-finder-panel');
        if (existingPanel) existingPanel.remove();

        const panel = createResultsPanel();
        const resultsContainer = panel.querySelector('#duplicate-results')!;
        const countElement = panel.querySelector('#duplicate-count')!;
        
        const totalDuplicates = groups.reduce((sum, group) => sum + group.duplicates.length, 0);
        countElement.textContent = `${totalDuplicates} duplicates found in ${groups.length} groups`;

        groups.forEach((group, groupIndex) => {
          const groupElement = document.createElement('div');
          groupElement.className = 'duplicate-group';
          groupElement.innerHTML = `
            <div class="original-song">
              <strong>Original:</strong> ${group.original.title} - ${group.original.artist}
              <span class="similarity">${Math.round(group.similarity)}% similar</span>
            </div>
            <div class="duplicates-list">
              ${group.duplicates.map((duplicate, index) => `
                <div class="duplicate-item" data-group="${groupIndex}" data-index="${index}">
                  <span class="song-info">${duplicate.title} - ${duplicate.artist}</span>
                  <button class="remove-duplicate" data-id="${duplicate.id}">Remove</button>
                </div>
              `).join('')}
            </div>
          `;
          resultsContainer.appendChild(groupElement);
        });

        // Add event listeners for individual remove buttons
        panel.querySelectorAll('.remove-duplicate').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            const id = target.getAttribute('data-id');
            if (id) {
              await removeDuplicate(id);
              target.closest('.duplicate-item')?.remove();
            }
          });
        });

        document.body.appendChild(panel);
      };

      const removeDuplicate = async (id: string) => {
        // Find the song element and simulate removal action
        const songElement = duplicateGroups
          .flatMap(g => [g.original, ...g.duplicates])
          .find(s => s.id === id)?.element;
        
        if (songElement) {
          // Try to find and click remove/delete button
          const removeBtn = songElement.querySelector('[aria-label*="remove"], [aria-label*="delete"], .delete-button');
          if (removeBtn) {
            (removeBtn as HTMLElement).click();
          } else {
            // Try right-click context menu approach
            songElement.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
            setTimeout(() => {
              const contextMenu = document.querySelector('[role="menu"]');
              const removeOption = contextMenu?.querySelector('[aria-label*="Remove"], [aria-label*="Delete"]');
              if (removeOption) {
                (removeOption as HTMLElement).click();
              }
            }, 100);
          }
        }
      };

      const removeAllDuplicates = async () => {
        const config = await context.getConfig();
        let removedCount = 0;
        
        for (const group of duplicateGroups) {
          for (const duplicate of group.duplicates) {
            await removeDuplicate(duplicate.id);
            removedCount++;
            // Add small delay to avoid overwhelming the interface
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        if (config.showNotification) {
          // Show notification
          const notification = document.createElement('div');
          notification.className = 'duplicate-finder-notification';
          notification.textContent = `Removed ${removedCount} duplicate songs`;
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.remove();
          }, 3000);
        }
      };

      // Message listener for menu actions
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'DUPLICATE_FINDER_SCAN') {
          if (isScanning) return;
          
          isScanning = true;
          try {
            duplicateGroups = await scanForDuplicates();
            displayResults(duplicateGroups);
          } catch (error) {
            console.error('Error scanning for duplicates:', error);
          } finally {
            isScanning = false;
          }
        } else if (event.data.type === 'DUPLICATE_FINDER_SHOW_PANEL') {
          if (duplicateGroups.length > 0) {
            displayResults(duplicateGroups);
          } else {
            alert('No scan results available. Please run a scan first.');
          }
        }
      });

      // Auto-scan on page load if enabled
      const config = await context.getConfig();
      if (config.enabled && config.autoRemove) {
        setTimeout(async () => {
          duplicateGroups = await scanForDuplicates();
          if (duplicateGroups.length > 0) {
            console.log(`Found ${duplicateGroups.length} duplicate groups`);
          }
        }, 2000);
      }
    },

    onPlayerApiReady(api, context) {
      // Plugin is ready when player API is available
      console.log('Duplicate Finder: Player API ready');
    },

    onConfigChange(newConfig) {
      console.log('Duplicate Finder: Config updated', newConfig);
    },

    stop() {
      // Cleanup when plugin is stopped
      const panel = document.getElementById('duplicate-finder-panel');
      if (panel) panel.remove();
    },
  },
});
