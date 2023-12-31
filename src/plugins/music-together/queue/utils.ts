export const mapQueueItem = <T>(map: (item: any | null) => T, array: any[]): T[] => array
  .map((item) => {
    if ('playlistPanelVideoWrapperRenderer' in item) {
      const keys = Object.keys(item.playlistPanelVideoWrapperRenderer.primaryRenderer);
      return item.playlistPanelVideoWrapperRenderer.primaryRenderer[keys[0]];
    }
    if ('playlistPanelVideoRenderer' in item) {
      return item.playlistPanelVideoRenderer;
    }

    console.error('Music Together: Unknown item', item);
    return null;
  })
  .map(map);

