/**
 * @file HTTP API contract between the client and the server.
 *
 * Both sides import these zod schemas, so the server validates requests and the client
 * validates responses against exactly the same shapes. See docs/api-contract.md for the
 * human-readable version.
 */
import { z } from 'zod';
import { Id, TopicAreaSchema } from './schema';

/** Maximum message length in characters (JavaScript string length). FR 1.1, FR 5.3. */
export const MESSAGE_MAX_LENGTH = 100;

/** Upper bound on how many discussed intent IDs one request may carry. FR 5.6. */
export const MAX_DISCUSSED_INTENTS = 100;

/** Paths of every endpoint, so neither side hard-codes a URL string. */
export const API_PATHS = {
  start: '/api/start',
  messages: '/api/messages',
  suggestions: '/api/suggestions',
  sources: '/api/sources',
} as const;

/**
 * Body of `POST /api/messages`. FR 5.2, FR 5.3, FR 5.6.
 *
 * `discussedIntentIds` is ordered oldest to newest with no duplicates; the last item is the
 * previous intent, which the server uses for follow-ups such as "tell me more" (FR 7.1).
 */
export const SendMessageRequestSchema = z.object({
  message: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
  discussedIntentIds: z
    .array(Id)
    .max(MAX_DISCUSSED_INTENTS)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Intent IDs must be unique',
    }),
});

/** Successful (200) response of `POST /api/messages`. */
export const SendMessageResponseSchema = z.object({
  /** Jimi's reply, always plain text. */
  reply: z.string().min(1),
  /** The matched intent, or null for the fallback and safety deflections (FR 2.5–2.7). */
  intentId: Id.nullable(),
  /** The topic area of the matched intent, or null. Drives the progress UI (FR 7.2). */
  areaId: Id.nullable(),
  /** One-off closing message, sent only on the reply that first covers every tracked area (FR 7.3). */
  closing: z.string().min(1).optional(),
});

/** Machine-readable error codes the server may return. */
export const ApiErrorCodeSchema = z.enum([
  'INVALID_MESSAGE',
  'INVALID_INTENT_IDS',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
]);

/** Body of every non-2xx response (400, 429, 500). Never contains a stack trace (NFR-12). */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
  }),
});

/** Response of `GET /api/start`: the opening greeting and the topic areas. FR 4.1, FR 7.2, FR 3.3. */
export const StartResponseSchema = z.object({
  greeting: z.string().min(1),
  areas: z.array(TopicAreaSchema).min(1),
});

/** Response of `GET /api/suggestions`. Each suggestion is tagged with its area. FR 1.5, FR 5.4. */
export const SuggestionsResponseSchema = z.object({
  suggestions: z.array(
    z.object({
      text: z.string().min(1).max(MESSAGE_MAX_LENGTH),
      areaId: Id,
    }),
  ),
});

/** Response of `GET /api/sources`: references in APA format. FR 4.8, NFR-21. */
export const SourcesResponseSchema = z.object({
  sources: z.array(
    z.object({
      id: Id,
      apa: z.string().min(1),
    }),
  ),
});

/** Body of `POST /api/messages`. */
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;
/** Successful response of `POST /api/messages`. */
export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;
/** One of the machine-readable error codes. */
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
/** Body of every non-2xx response. */
export type ApiErrorBody = z.infer<typeof ApiErrorSchema>;
/** Response of `GET /api/start`. */
export type StartResponse = z.infer<typeof StartResponseSchema>;
/** Response of `GET /api/suggestions`. */
export type SuggestionsResponse = z.infer<typeof SuggestionsResponseSchema>;
/** One suggested question. */
export type Suggestion = SuggestionsResponse['suggestions'][number];
/** Response of `GET /api/sources`. */
export type SourcesResponse = z.infer<typeof SourcesResponseSchema>;
/** One APA reference. */
export type Source = SourcesResponse['sources'][number];
