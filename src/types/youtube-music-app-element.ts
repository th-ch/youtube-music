export interface YouTubeMusicAppElement extends HTMLElement {
  navigate(page: string): void;
  networkManager: {
    fetch: (url: string, data: unknown) => Promise<unknown>;
  };
}
