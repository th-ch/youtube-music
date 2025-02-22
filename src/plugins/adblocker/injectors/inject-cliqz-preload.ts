export default async (): Promise<void> => {
  try {
    await import('@ghostery/adblocker-electron-preload');
  } catch (error) {
    console.error('Failed to load @ghostery/adblocker-electron-preload', error);
  }
};
