export interface APIServerConfig {
  enabled: boolean;
  hostname: string;
  port: number;
  authStrategy: 'AUTH_AT_FIRST' | 'NONE';
  secret: string;

  authorizedClients: string[];
}

export const defaultAPIServerConfig: APIServerConfig = {
  enabled: true,
  hostname: '0.0.0.0',
  port: 26538,
  authStrategy: 'AUTH_AT_FIRST',
  secret: Date.now().toString(36),

  authorizedClients: [],
};
