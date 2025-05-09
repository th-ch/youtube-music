import axios, { AxiosResponse } from 'axios';

/**
 * Centralized Slack API client for all requests
 */
export class SlackApiClient {
  readonly token: string;
  readonly cookie: string;

  constructor(token: string, cookie: string) {
    this.token = token;
    this.cookie = cookie;
  }

  private getBaseHeaders(): Record<string, string> {
    return {
      'Cookie': `d=${this.cookie}`,
    };
  }

  /**
   * POST to a Slack API endpoint
   */
  async post(endpoint: string, data: any, formData = false): Promise<AxiosResponse> {
    const url = `https://slack.com/api/${endpoint}`;

    let headers = this.getBaseHeaders();
    let payload = data;
    if (formData) {
      headers = { ...headers, ...data.getHeaders() };
    } else {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      payload = new URLSearchParams(data).toString();
    }

    try {
      return await axios.post(url, payload, { headers, maxBodyLength: Infinity, validateStatus: () => true });
    } catch (error) {
      console.error(`Error in Slack API POST to ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * GET from a Slack API endpoint
   */
  async get(endpoint: string, params: Record<string, any> = {}): Promise<AxiosResponse> {
    const url = `https://slack.com/api/${endpoint}`;

    const headers = this.getBaseHeaders();

    try {
      return await axios.get(url, { headers, params, validateStatus: () => true });
    } catch (error) {
      console.error(`Error in Slack API GET to ${endpoint}:`, error);
      throw error;
    }
  }
}

export interface SlackApiResponse {
  ok: boolean;
  error?: string;
  [key: string]: any;
}
