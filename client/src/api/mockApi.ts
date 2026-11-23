/**
 * @file In-browser stand-in for the server, used in development until the real backend is ready.
 *
 * It follows the same contract as the server (same schemas, same 400 errors, same one-off
 * closing message), but its "matching" is deliberately naive: one keyword list per intent and no
 * typo tolerance or follow-ups. The real matching engine lives in the server (FR 2.1). All text
 * is placeholder content, marked "(mock)".
 */
import {
  SendMessageRequestSchema,
  type SendMessageResponse,
  type SourcesResponse,
  type StartResponse,
  type SuggestionsResponse,
} from '@hendrix/shared';
import { ApiError, type ChatApi } from './chatApi';

/** Options for {@link createMockApi}. */
export interface MockApiOptions {
  /** Simulated network delay per request, in milliseconds. */
  latencyMs?: number;
}

interface MockIntent {
  id: string;
  areaId: string;
  keywords: string[];
  reply: string;
}

const START: StartResponse = {
  greeting: "Hey, how's it going? I'm Jimi. Ask me anything about my music, man. (mock)",
  areas: [
    { id: 'life-story', label: 'Life story', tracked: true },
    { id: 'famous-gigs', label: 'Famous gigs', tracked: true },
    { id: 'guitars-technique', label: 'Guitars and technique', tracked: true },
    { id: 'music-albums', label: 'Music and albums', tracked: true },
    { id: 'small-talk', label: 'Small talk', tracked: false },
  ],
};

const INTENTS: MockIntent[] = [
  {
    id: 'ask-about-childhood',
    areaId: 'life-story',
    keywords: ['childhood', 'seattle', 'born', 'young'],
    reply: 'I grew up in Seattle, man. That is where it all started. (mock)',
  },
  {
    id: 'ask-about-woodstock',
    areaId: 'famous-gigs',
    keywords: ['woodstock', 'gig', 'festival', 'concert'],
    reply: 'Woodstock was something else. Early morning, and the crowd was still there. (mock)',
  },
  {
    id: 'ask-about-guitar',
    areaId: 'guitars-technique',
    keywords: ['guitar', 'stratocaster', 'strat', 'play'],
    reply: "I play a Stratocaster flipped upside down, 'cause I'm left-handed. (mock)",
  },
  {
    id: 'ask-about-albums',
    areaId: 'music-albums',
    keywords: ['album', 'albums', 'record', 'song', 'songs'],
    reply: 'Making records is like painting with sound. (mock)',
  },
  {
    id: 'small-talk-hello',
    areaId: 'small-talk',
    keywords: ['hello', 'hi', 'hey', 'thanks'],
    reply: 'Hey there, glad you dropped by. (mock)',
  },
];

const FALLBACK_REPLY =
  'Whoa, that one floated right past me. Ask me about my life, my gigs, my guitars or my music. (mock)';

const CLOSING_MESSAGE =
  "Man, we've covered my whole story. Thanks for hanging out with me. (mock closing message)";

const SUGGESTIONS: SuggestionsResponse = {
  suggestions: [
    { text: 'Where did you grow up?', areaId: 'life-story' },
    { text: 'What was Woodstock like?', areaId: 'famous-gigs' },
    { text: 'What guitar do you play?', areaId: 'guitars-technique' },
    { text: 'Which album are you proudest of?', areaId: 'music-albums' },
  ],
};

// Placeholders only: real APA references come from the server's data (NFR-21).
const SOURCES: SourcesResponse = {
  sources: [
    {
      id: 'mock-source-1',
      apa: 'Placeholder, A. (1970). Mock source one (Development data only).',
    },
    {
      id: 'mock-source-2',
      apa: 'Placeholder, B. (1969). Mock source two (Development data only).',
    },
  ],
};

const TRACKED_AREA_IDS = START.areas.filter((area) => area.tracked).map((area) => area.id);

/**
 * Finds the first mock intent whose keywords include a word of the message.
 * @param message - The user's message.
 */
function matchIntent(message: string): MockIntent | undefined {
  const words = message.toLowerCase().split(/[^a-z0-9]+/);
  return INTENTS.find((intent) => intent.keywords.some((keyword) => words.includes(keyword)));
}

/**
 * Returns true when the given intents cover every tracked topic area.
 * @param intentIds - Intent IDs discussed so far.
 */
function coversAllAreas(intentIds: string[]): boolean {
  const covered = new Set(
    INTENTS.filter((intent) => intentIds.includes(intent.id)).map((intent) => intent.areaId),
  );
  return TRACKED_AREA_IDS.every((areaId) => covered.has(areaId));
}

/**
 * Creates a mock `ChatApi` that answers from canned data after a short delay.
 * @param options - Optional simulated latency.
 */
export function createMockApi(options: MockApiOptions = {}): ChatApi {
  const { latencyMs = 300 } = options;

  /**
   * Resolves with a copy of `value` after the simulated latency.
   * @param value - The response to return.
   */
  function respond<T>(value: T): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(structuredClone(value)), latencyMs);
    });
  }

  return {
    start: () => respond(START),
    getSuggestions: () => respond(SUGGESTIONS),
    getSources: () => respond(SOURCES),

    sendMessage: async (request) => {
      // Validate exactly as the server will, so contract mistakes show up in development (FR 5.3, 5.6).
      const parsed = SendMessageRequestSchema.safeParse(request);
      if (!parsed.success) {
        const field = parsed.error.issues[0]?.path[0];
        throw new ApiError('http', parsed.error.issues[0]?.message ?? 'Invalid request', {
          status: 400,
          code: field === 'message' ? 'INVALID_MESSAGE' : 'INVALID_INTENT_IDS',
        });
      }

      const { message, discussedIntentIds } = parsed.data;
      const intent = matchIntent(message);
      const response: SendMessageResponse = {
        reply: intent?.reply ?? FALLBACK_REPLY,
        intentId: intent?.id ?? null,
        areaId: intent?.areaId ?? null,
      };

      // FR 7.3: only the reply that *first* completes every area carries the closing message.
      if (intent && !coversAllAreas(discussedIntentIds)) {
        const after = discussedIntentIds.filter((id) => id !== intent.id).concat(intent.id);
        if (coversAllAreas(after)) {
          response.closing = CLOSING_MESSAGE;
        }
      }
      return respond(response);
    },
  };
}
