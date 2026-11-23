import express, { type NextFunction, type Request, type Response } from 'express';
import {
  API_PATHS,
  MESSAGE_MAX_LENGTH,
  SendMessageRequestSchema,
  type SendMessageResponse,
  type StartResponse,
} from '@hendrix/shared';
import { loadDialogue } from './content/loadDialogue';
import { findIntent } from './engine/findIntent';
import { pickVariant } from './engine/pickVariant';
import { sendError } from './http/sendError';

// Load and validate Jimi's dialogue before accepting any requests (FR 5.1, FR 5.5).
const dialogue = loadDialogue();

const app = express();
const PORT = 3001;

// Parse JSON bodies, refusing anything over 4 KB (NFR-12; see docs/api-contract.md).
app.use(express.json({ limit: '4kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Greeting and topic areas, loaded once when the chat opens (FR 4.1, FR 7.2, FR 3.3).
app.get(API_PATHS.start, (req, res) => {
  const body: StartResponse = {
    greeting: pickVariant(dialogue.greeting).text,
    areas: dialogue.areas,
  };
  res.json(body);
});

// One message in, one reply out (FR 5.2, FR 5.3, FR 5.6).
app.post(API_PATHS.messages, (req, res) => {
  const parsed = SendMessageRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    const badIds = parsed.error.issues.some((issue) => issue.path[0] === 'discussedIntentIds');
    if (badIds) {
      sendError(
        res,
        400,
        'INVALID_INTENT_IDS',
        'discussedIntentIds must be unique kebab-case IDs.',
      );
    } else {
      sendError(
        res,
        400,
        'INVALID_MESSAGE',
        `Message must be 1 to ${MESSAGE_MAX_LENGTH} characters.`,
      );
    }
    return;
  }

  const intent = findIntent(parsed.data.message, dialogue.intents);

  const body: SendMessageResponse = intent
    ? { reply: pickVariant(intent.variants).text, intentId: intent.id, areaId: intent.area }
    : { reply: pickVariant(dialogue.fallback).text, intentId: null, areaId: null }; // FR 2.5

  res.json(body);
});

// Last-resort error handler: malformed JSON, oversized bodies and unexpected crashes
// all get a contract-shaped error with no stack trace (NFR-12, NFR-17).
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  const type = (err as { type?: string }).type;

  if (type === 'entity.parse.failed') {
    sendError(res, 400, 'INVALID_MESSAGE', 'Request body must be valid JSON.');
  } else if (type === 'entity.too.large') {
    sendError(res, 413, 'INVALID_MESSAGE', 'Request body is too large.');
  } else {
    console.error(err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
  }
});

app.listen(PORT, () => {
  console.log(`Loaded ${dialogue.intents.length} intents across ${dialogue.areas.length} areas.`);
  console.log(`Server running at http://localhost:${PORT}`);
});
