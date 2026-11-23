/**
 * @file `ChatApi` implementation that talks to the real Express server over HTTP.
 *
 * Every request has a hard time limit (FR 6.1), and every response body is checked against the
 * shared zod schemas, so a broken server response becomes an `ApiError` rather than a crash
 * somewhere in the UI (NFR-17).
 */
import {
  API_PATHS,
  ApiErrorSchema,
  SendMessageResponseSchema,
  SourcesResponseSchema,
  StartResponseSchema,
  SuggestionsResponseSchema,
} from '@hendrix/shared';
import { ApiError, type ChatApi } from './chatApi';

/** FR 6.1: a request that takes longer than this counts as failed. */
export const REQUEST_TIMEOUT_MS = 5000;

/** Options for {@link createHttpApi}. The defaults are right for the app; tests override them. */
export interface HttpApiOptions {
  /** Prefix for every path. Empty by default, because Vite proxies `/api` in development. */
  baseUrl?: string;
  /** Time limit per request, in milliseconds. */
  timeoutMs?: number;
  /** The `fetch` to use. Tests pass a fake one. */
  fetchFn?: typeof fetch;
}

/**
 * Anything with a zod-style `safeParse`. Typing it structurally means this file does not
 * import zod itself; the schemas come ready-made from `@hendrix/shared`.
 */
interface Parser<T> {
  safeParse(data: unknown): { success: true; data: T } | { success: false };
}

/**
 * Parses a response body as JSON, returning `undefined` instead of throwing if it is not JSON.
 * @param text - Raw response body.
 */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Creates a `ChatApi` that calls the server over HTTP.
 * @param options - Optional base URL, timeout and `fetch` override.
 */
export function createHttpApi(options: HttpApiOptions = {}): ChatApi {
  const {
    baseUrl = '',
    timeoutMs = REQUEST_TIMEOUT_MS,
    fetchFn = (input, init) => fetch(input, init),
  } = options;

  /**
   * Sends one request, enforces the timeout and validates the response body.
   * @param path - Endpoint path from `API_PATHS`.
   * @param schema - Schema the successful response body must match.
   * @param init - Extra `fetch` options (method, body).
   */
  async function request<T>(path: string, schema: Parser<T>, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchFn(baseUrl + path, {
        ...init,
        headers: { Accept: 'application/json', ...init.headers },
        signal: controller.signal,
      });
      // Read the body inside the timeout too: a server that stalls mid-body is still too slow.
      const body = parseJson(await response.text());

      if (!response.ok) {
        const errorBody = ApiErrorSchema.safeParse(body);
        throw new ApiError(
          'http',
          errorBody.success ? errorBody.data.error.message : `HTTP ${response.status}`,
          {
            status: response.status,
            code: errorBody.success ? errorBody.data.error.code : undefined,
          },
        );
      }

      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid-response', `Response from ${path} did not match the contract`);
      }
      return parsed.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (controller.signal.aborted) {
        throw new ApiError('timeout', `${path} took longer than ${timeoutMs} ms`, { cause: error });
      }
      throw new ApiError('network', `Could not reach ${path}`, { cause: error });
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    start: () => request(API_PATHS.start, StartResponseSchema),
    sendMessage: (body) =>
      request(API_PATHS.messages, SendMessageResponseSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    getSuggestions: () => request(API_PATHS.suggestions, SuggestionsResponseSchema),
    getSources: () => request(API_PATHS.sources, SourcesResponseSchema),
  };
}
