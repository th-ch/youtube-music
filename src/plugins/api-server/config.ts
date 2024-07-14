export interface APIServerConfig {
  enabled: boolean;
  hostname: string;
  port: number;
  authStrategy: 'AUTH_AT_FIRST' | 'NONE';
  secret: string;
  websocket: boolean,
  websocketPort: number;

  authorizedClients: string[];
  volume: number;
}

export const defaultAPIServerConfig: APIServerConfig = {
  enabled: true,
  hostname: '0.0.0.0',
  port: 26538,
  authStrategy: 'AUTH_AT_FIRST',
  secret: Date.now().toString(36),
  websocket: true,
  websocketPort: 26539,

  authorizedClients: [],
  volume: 0,
};
