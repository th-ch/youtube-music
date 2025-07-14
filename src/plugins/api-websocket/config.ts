export interface APIWebsocketConfig {
    enabled: boolean
    hostname: string
    port: number
    volume: number
}

export const defaultAPIWebsocketConfig: APIWebsocketConfig = {
    enabled: false,
    hostname: "0.0.0.0",
    port: 26539,
    volume: 100,
}