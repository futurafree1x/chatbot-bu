/**
 * @file The `ChatApi` interface every API implementation must satisfy, and the single error type
 * they throw. UI code depends only on this file, never on `fetch`, so the real HTTP client and
 * the mock are interchangeable.
 */
import type {
  ApiErrorCode,
  SendMessageRequest,
  SendMessageResponse,
  SourcesResponse,
  StartResponse,
  SuggestionsResponse,
} from '@hendrix/shared';

/** Everything the UI can ask the backend for. */
export interface ChatApi {
  /** Loads the greeting and the topic areas (FR 4.1, FR 7.2). */
  start(): Promise<StartResponse>;
  /** Sends one user message with the intents discussed so far (FR 5.2, FR 5.6). */
  sendMessage(request: SendMessageRequest): Promise<SendMessageResponse>;
  /** Loads the pool of suggested questions (FR 1.5, FR 5.4). */
  getSuggestions(): Promise<SuggestionsResponse>;
  /** Loads the APA references for the Sources page (FR 4.8). */
  getSources(): Promise<SourcesResponse>;
}

/**
 * Why a request failed:
 * - `timeout`: no complete response within the time limit (FR 6.1).
 * - `network`: the request never reached the server, or the connection dropped.
 * - `http`: the server answered with a non-2xx status.
 * - `invalid-response`: the server answered 2xx, but the body broke the contract.
 */
export type ApiErrorKind = 'timeout' | 'network' | 'http' | 'invalid-response';

/** Extra details attached to an {@link ApiError}. */
export interface ApiErrorDetails {
  /** HTTP status, when the server answered. */
  status?: number;
  /** Error code from the server's error body, when it sent a valid one. */
  code?: ApiErrorCode;
  /** The underlying error, for debugging. */
  cause?: unknown;
}

/** The only error type a `ChatApi` throws, so callers need one `catch` branch. */
export class ApiError extends Error {
  /** Category of failure; the UI uses it to decide what to show. */
  readonly kind: ApiErrorKind;
  /** HTTP status, when the server answered. */
  readonly status: number | undefined;
  /** Server error code, when available. */
  readonly code: ApiErrorCode | undefined;

  /**
   * @param kind - Category of failure.
   * @param message - Developer-facing description (never shown to users as-is).
   * @param details - Optional status, code and cause.
   */
  constructor(kind: ApiErrorKind, message: string, details: ApiErrorDetails = {}) {
    super(message, { cause: details.cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = details.status;
    this.code = details.code;
  }
}
