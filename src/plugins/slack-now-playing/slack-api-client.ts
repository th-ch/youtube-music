import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';

/**
 * Standard response format from Slack API endpoints
 * @template TData Type of the response data
 */
export interface SlackApiResponse<TData = unknown> {
  /** Whether the API call was successful */
  ok: boolean;
  /** Error code if the call failed */
  error?: string;
  /** Error description if available */
  error_description?: string;
  /** Warning messages from the API */
  warning?: string;
  /** Response data properties */
  [key: string]: any;
  /** Typed response data (available when ok is true) */
  data?: TData;
}

/**
 * Parameters for Slack API requests
 */
export type SlackApiParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Error thrown by the Slack API client
 */
export class SlackApiError extends Error {
  /** The original error that caused this error */
  readonly originalError: Error;
  /** The endpoint that was called */
  readonly endpoint: string;
  /** The HTTP status code if available */
  readonly statusCode?: number;
  /** The response data if available */
  readonly responseData?: SlackApiResponse;

  /**
   * Create a new Slack API error
   * @param message Error message
   * @param endpoint The API endpoint that was called
   * @param originalError The original error that caused this error
   * @param statusCode The HTTP status code if available
   * @param responseData The response data if available
   */
  constructor(
    message: string,
    endpoint: string,
    originalError: Error,
    statusCode?: number,
    responseData?: SlackApiResponse
  ) {
    super(message);
    this.name = 'SlackApiError';
    this.originalError = originalError;
    this.endpoint = endpoint;
    this.statusCode = statusCode;
    this.responseData = responseData;
  }
}

/**
 * Centralized Slack API client for making requests to the Slack API
 * 
 * This client handles authentication, error handling, and request formatting
 * for all Slack API calls in the application.
 */
export class SlackApiClient {
  /** The Slack API token (xoxc-) */
  readonly token: string;
  /** The Slack cookie token (xoxd-) */
  readonly cookie: string;
  /** Base URL for all Slack API requests */
  private readonly baseUrl = 'https://slack.com/api';

  /**
   * Create a new Slack API client
   * @param token The Slack API token (xoxc-)
   * @param cookie The Slack cookie token (xoxd-)
   */
  constructor(token: string, cookie: string) {
    this.token = token;
    this.cookie = cookie;
  }

  /**
   * Get the base headers required for all Slack API requests
   * @returns Headers object with authentication information
   */
  private getBaseHeaders(): Record<string, string> {
    return {
      'Cookie': `d=${this.cookie}`,
      'Authorization': `Bearer ${this.token}`,
    };
  }

  /**
   * Make a POST request to a Slack API endpoint
   * @param endpoint The API endpoint to call (without the base URL)
   * @param data The data to send in the request body
   * @param formData Whether the data is form data (multipart/form-data)
   * @returns The response from the API
   * @throws {SlackApiError} If the request fails
   */
  async post<T = any>(
    endpoint: string, 
    data: Record<string, any> | FormData, 
    formData = false
  ): Promise<AxiosResponse<SlackApiResponse<T>>> {
    const url = `${this.baseUrl}/${endpoint}`;

    let headers = this.getBaseHeaders();
    let payload: any = data;
    
    if (formData) {
      // If data is FormData, use its headers
      if (data instanceof FormData) {
        headers = { ...headers, ...data.getHeaders() };
      } else {
        // If it's a plain object but formData is true, convert it to FormData
        const form = new FormData();
        for (const [key, value] of Object.entries(data)) {
          form.append(key, value);
        }
        payload = form;
        headers = { ...headers, ...form.getHeaders() };
      }
    } else {
      // For regular POST requests, use URL-encoded format
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      payload = new URLSearchParams(data as Record<string, string>).toString();
    }

    try {
      const config: AxiosRequestConfig = {
        headers,
        maxBodyLength: Infinity,
        validateStatus: () => true, // Handle all status codes in our code
      };
      
      const response = await axios.post<SlackApiResponse<T>>(url, payload, config);
      
      // Check for API errors even if HTTP status is 200
      if (response.data && !response.data.ok) {
        throw new SlackApiError(
          `Slack API error: ${response.data.error || 'Unknown error'}`,
          endpoint,
          new Error(response.data.error_description || response.data.error || 'Unknown error'),
          response.status,
          response.data
        );
      }
      
      return response;
    } catch (error) {
      // Handle axios errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<SlackApiResponse>;
        throw new SlackApiError(
          `Slack API request failed: ${axiosError.message}`,
          endpoint,
          axiosError,
          axiosError.response?.status,
          axiosError.response?.data
        );
      }
      
      // Handle other errors
      throw new SlackApiError(
        `Error in Slack API POST to ${endpoint}: ${error instanceof Error ? error.message : String(error)}`,
        endpoint,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Make a GET request to a Slack API endpoint
   * @param endpoint The API endpoint to call (without the base URL)
   * @param params The query parameters to include in the request
   * @returns The response from the API
   * @throws {SlackApiError} If the request fails
   */
  async get<T = any>(
    endpoint: string, 
    params: SlackApiParams = {}
  ): Promise<AxiosResponse<SlackApiResponse<T>>> {
    const url = `${this.baseUrl}/${endpoint}`;
    const headers = this.getBaseHeaders();

    // Remove undefined and null values from params
    const cleanParams: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        cleanParams[key] = value;
      }
    }

    try {
      const config: AxiosRequestConfig = {
        headers,
        params: cleanParams,
        validateStatus: () => true, // Handle all status codes in our code
      };
      
      const response = await axios.get<SlackApiResponse<T>>(url, config);
      
      // Check for API errors even if HTTP status is 200
      if (response.data && !response.data.ok) {
        throw new SlackApiError(
          `Slack API error: ${response.data.error || 'Unknown error'}`,
          endpoint,
          new Error(response.data.error_description || response.data.error || 'Unknown error'),
          response.status,
          response.data
        );
      }
      
      return response;
    } catch (error) {
      // Handle axios errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<SlackApiResponse>;
        throw new SlackApiError(
          `Slack API request failed: ${axiosError.message}`,
          endpoint,
          axiosError,
          axiosError.response?.status,
          axiosError.response?.data
        );
      }
      
      // Handle other errors
      throw new SlackApiError(
        `Error in Slack API GET to ${endpoint}: ${error instanceof Error ? error.message : String(error)}`,
        endpoint,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
