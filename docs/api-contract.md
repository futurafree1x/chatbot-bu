# API contract (proposal)

**Status:** proposal for the backend owners to review. Nothing here is final until we agree it in the PR.

The source of truth is [`shared/src/api.ts`](../shared/src/api.ts). Those zod schemas are imported by both sides: the server validates requests with them, and the client validates responses with them. If this document and that file disagree, the file wins. Please fix the document.

All bodies are JSON. All text is plain text. The client never renders HTML (NFR-13).

## Endpoints

| Method and path | Purpose | Requirements |
| --- | --- | --- |
| `GET /api/start` | Greeting and topic areas, loaded once when the page opens | FR 4.1, FR 7.2, FR 3.3 |
| `POST /api/messages` | Send one message, get Jimi's reply | FR 5.2, FR 5.3, FR 5.6, FR 7.1, FR 7.3 |
| `GET /api/suggestions` | Pool of suggested questions | FR 1.5, FR 5.4 |
| `GET /api/sources` | APA references for the Sources page | FR 4.8, NFR-21 |

### `GET /api/start`

```json
{
  "greeting": "Hey, how's it going? I'm Jimi.",
  "areas": [
    { "id": "life-story", "label": "Life story", "tracked": true },
    { "id": "famous-gigs", "label": "Famous gigs", "tracked": true },
    { "id": "guitars-technique", "label": "Guitars and technique", "tracked": true },
    { "id": "music-albums", "label": "Music and albums", "tracked": true },
    { "id": "small-talk", "label": "Small talk", "tracked": false }
  ]
}
```

- `greeting` is one variant picked from the dialogue data's weighted `greeting` list.
- `areas` is the dialogue data's `areas` array, unchanged (`TopicAreaSchema`). The client shows every area with `tracked: true` in the progress bar. That's how a new area added in JSON appears with no code change (FR 3.3).

### `POST /api/messages`

Request:

```json
{
  "message": "What guitar do you play?",
  "discussedIntentIds": ["ask-about-childhood", "ask-about-woodstock"]
}
```

| Field | Rule | If broken |
| --- | --- | --- |
| `message` | String, 1–100 characters after trimming (JavaScript string length, so one emoji counts as 2) | 400 `INVALID_MESSAGE` |
| `discussedIntentIds` | Array of kebab-case IDs, unique, at most 100, ordered oldest to newest | 400 `INVALID_INTENT_IDS` |

- The **last** ID is the previous intent, which is what "tell me more" refers to (FR 7.1).
- When a question is repeated, the client moves that ID to the end rather than adding it twice. The server can still spot repeats (FR 7.4).
- Optional extra check: the server may also reject IDs that don't exist in the dialogue data. FR 5.6 says "validate", so we should agree whether that means format only or format plus existence.

Response (200):

```json
{
  "reply": "I play a Stratocaster, flipped upside down, 'cause I'm left-handed.",
  "intentId": "ask-about-guitar",
  "areaId": "guitars-technique"
}
```

| Field | Meaning |
| --- | --- |
| `reply` | Jimi's reply. |
| `intentId` | The matched intent. `null` for the fallback redirect and the safety deflections (FR 2.5–2.7), so those never count as progress. |
| `areaId` | The area of the matched intent, or `null`. The client marks this area as explored (FR 7.2). |
| `closing` | *Optional.* The one-off closing message (FR 7.3). |

**When to send `closing`:** only when the areas covered by `discussedIntentIds` did **not** include every tracked area, and the areas covered by `discussedIntentIds` plus this reply's intent **do**. That rule fires exactly once per conversation, and the server needs no memory to apply it. The client also refuses to show it twice.

### `GET /api/suggestions`

```json
{
  "suggestions": [
    { "text": "What was Woodstock like?", "areaId": "famous-gigs" },
    { "text": "What guitar do you play?", "areaId": "guitars-technique" }
  ]
}
```

Return the whole pool, each suggestion tagged with its area. The client shows two, picking unexplored areas first. Each `text` must be 100 characters or fewer, because it is sent as a message (FR 1.6).

### `GET /api/sources`

```json
{
  "sources": [{ "id": "cross-2005", "apa": "Cross, C. R. (2005). Room full of mirrors: A biography of Jimi Hendrix. Hyperion." }]
}
```

`id` is the `sourceId` used on reply variants (NFR-21).

## Errors

Every non-2xx response uses one shape, and it never includes a stack trace (NFR-12):

```json
{ "error": { "code": "INVALID_MESSAGE", "message": "Message must be 1 to 100 characters." } }
```

| Status | `code` |
| --- | --- |
| 400 | `INVALID_MESSAGE`, `INVALID_INTENT_IDS` |
| 429 | `RATE_LIMITED` (NFR-14) |
| 500 | `INTERNAL_ERROR` |

The client gives up after **5 seconds** (FR 6.1). It treats a timeout, a network failure, any non-2xx status, or a 200 body that doesn't match the schema in the same way: an in-character error with a Retry button.

## Changes the current server needs

`server/src/index.ts` is the placeholder from PR #1. To meet this contract it needs to:

1. Validate the body with `SendMessageRequestSchema` from `@hendrix/shared`, instead of the hand-written check.
2. Return `{ error: { code, message } }` instead of `{ error: "..." }`.
3. Add `intentId` and `areaId` to the reply, and `closing` when it applies.
4. Add `GET /api/start`, `GET /api/suggestions` and `GET /api/sources`.

`@hendrix/shared` now has a `src/index.ts`. Its `package.json` already pointed `main` at that file, but the file didn't exist, so imports of `@hendrix/shared` failed.

## Open question: request size limit (NFR-12 vs FR 5.6)

NFR-12 sets a 1 KB body limit. A full conversation can go over it: 35–40 intent IDs such as `"ask-about-woodstock",` take about 900 bytes, and the message adds up to 400 bytes more, because 100 emoji are 400 bytes in UTF-8. The worst case at the 100-ID cap is about 2.5 KB.

**Suggested fix:** change NFR-12 to a **4 KB** limit. It still blocks large payloads. The alternative is having the client send fewer IDs, which would weaken repeat detection (FR 7.4).

## Development mock

Until the server implements this contract, the client uses an in-browser mock, [`client/src/api/mockApi.ts`](../client/src/api/mockApi.ts). It follows this contract, including the 400 errors and the closing rule. Its keyword matching is deliberately basic, and all its text is placeholder. To switch the client to the real server, set `VITE_USE_MOCK=false` in `client/.env.development`.
