import net from 'net';

import type { AuthProxyConfig } from '../config';
import type { Server } from 'http';

export type BackendType = {
  server?: Server | net.Server;
  oldConfig?: AuthProxyConfig;
  startServer: (server_config: AuthProxyConfig) => void;
  stopServer: () => void;
  proxyString?: string;
  _savedProxy?: string;
  handleSocks5: (
    clientSocket: net.Socket,
    chunk: Buffer,
    upstreamProxyUrl: string,
  ) => void;
  handleSocks4: (
    clientSocket: net.Socket,
    chunk: Buffer,
    upstreamProxyUrl: string,
  ) => void;
  processSocks5Request: (
    clientSocket: net.Socket,
    data: Buffer,
    upstreamProxyUrl: string,
  ) => void;
};
