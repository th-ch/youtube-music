export const waitForElement = <T extends Element>(
  selector: string,
): Promise<T> => {
  return new Promise<T>((resolve) => {
    const interval = setInterval(() => {
      const elem = document.querySelector<T>(selector);
      if (!elem) return;

      clearInterval(interval);
      resolve(elem);
    }, 100 /* ms */);
  });
};
