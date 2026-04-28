/**
 * Enhanced API Client with security, retry logic, and error handling
 */

const BASE = "/api/v1";
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
}

class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch with timeout support
 */
const fetchWithTimeout = async (
  url: string,
  config: RequestConfig = {}
): Promise<Response> => {
  const { timeout = DEFAULT_TIMEOUT, ...fetchConfig } = config;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchConfig,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new APIError('Request timeout', 408, 'TIMEOUT');
    }
    throw error;
  }
};

/**
 * Parse JSON response with error handling
 */
const parseJson = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type');
  
  if (!contentType?.includes('application/json')) {
    throw new APIError(
      `Unexpected content type: ${contentType}`,
      response.status,
      'INVALID_CONTENT_TYPE'
    );
  }
  
  try {
    const data = await response.json() as T & {
      detail?: string | { message?: string; code?: string };
      code?: string;
    };
    
    if (!response.ok) {
      const detail = data.detail;
      const errorMessage = typeof detail === 'string'
        ? detail
        : detail?.message || `HTTP ${response.status}: ${response.statusText}`;
      const errorCode = typeof detail === 'string'
        ? data.code || 'HTTP_ERROR'
        : detail?.code || data.code || 'HTTP_ERROR';

      throw new APIError(
        errorMessage,
        response.status,
        errorCode
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(
      'Failed to parse response',
      response.status,
      'PARSE_ERROR'
    );
  }
};

/**
 * Make API request with retry logic
 */
const apiRequest = async <T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> => {
  const { retries = MAX_RETRIES, ...fetchConfig } = config;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(`${BASE}${endpoint}`, fetchConfig);
      return await parseJson<T>(response);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
      if (error instanceof APIError) {
        if (error.status && error.status >= 400 && error.status < 500) {
          if (error.status !== 408 && error.status !== 429) {
            throw error;
          }
        }
      }
      
      // Don't retry on last attempt
      if (attempt === retries) break;
      
      // Exponential backoff
      await sleep(RETRY_DELAY * Math.pow(2, attempt));
    }
  }
  
  throw lastError || new APIError('Request failed', undefined, 'UNKNOWN_ERROR');
};

/**
 * API Methods
 */
export const api = {
  uploadFile: async (file: File): Promise<{ id: number; filename: string }> => {
    const form = new FormData();
    form.append("file", file);
    
    const response = await fetchWithTimeout(`${BASE}/ingest/file`, {
      method: "POST",
      body: form,
      timeout: 120000, // 2 minutes for large files
    });
    
    return parseJson(response);
  },

  ingestURL: async (url: string): Promise<{ id: number; filename: string }> => {
    const form = new FormData();
    form.append('url', url);
    return apiRequest('/ingest/url', {
      method: 'POST',
      body: form,
    });
  },

  buildIndex: async (): Promise<{ indexed_count: number }> => {
    return apiRequest('/admin/index/build', {
      method: 'POST',
      timeout: 120000, // 2 minutes for indexing
    });
  },

  resetDatabase: async (): Promise<{
    status: string;
    message: string;
    cleared: {
      faiss_vectors: number;
      chunks: number;
      evaluations: number;
    };
  }> => {
    return apiRequest('/admin/reset-db', {
      method: 'DELETE',
    });
  },

  runEvaluation: async (sessionId: string): Promise<{
    faithfulness?: number;
    answer_relevancy?: number;
    context_precision?: number;
  }> => {
    return apiRequest(`/eval/run/${sessionId}`, {
      method: 'POST',
      timeout: 60000, // 1 minute for evaluation
    });
  },

  getEvaluation: async (sessionId: string): Promise<{
    session_id: string;
    question: string;
    answer: string;
    faithfulness?: number;
    answer_relevancy?: number;
    context_precision?: number;
    created_at?: string;
  }> => {
    return apiRequest(`/eval/${sessionId}`, {
      method: 'GET',
    });
  },
};

export { APIError };


