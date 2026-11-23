import {
  MAX_DISCUSSED_INTENTS,
  MESSAGE_MAX_LENGTH,
  SendMessageRequestSchema,
  SendMessageResponseSchema,
} from '@hendrix/shared';
import { describe, expect, it } from 'vitest';

/** Shorthand: does this request body pass the shared schema? */
function isValidRequest(body: unknown): boolean {
  return SendMessageRequestSchema.safeParse(body).success;
}

describe('SendMessageRequestSchema (FR 1.1, 5.3, 5.6)', () => {
  it('accepts a message of exactly 100 characters', () => {
    expect(
      isValidRequest({ message: 'a'.repeat(MESSAGE_MAX_LENGTH), discussedIntentIds: [] }),
    ).toBe(true);
  });

  it('rejects a message of 101 characters', () => {
    expect(
      isValidRequest({ message: 'a'.repeat(MESSAGE_MAX_LENGTH + 1), discussedIntentIds: [] }),
    ).toBe(false);
  });

  it.each(['', '   ', '\n\t'])('rejects an empty or whitespace-only message (%j)', (message) => {
    expect(isValidRequest({ message, discussedIntentIds: [] })).toBe(false);
  });

  it('rejects a missing message', () => {
    expect(isValidRequest({ discussedIntentIds: [] })).toBe(false);
  });

  it('accepts unique kebab-case intent IDs', () => {
    expect(
      isValidRequest({
        message: 'hi',
        discussedIntentIds: ['ask-about-guitar', 'ask-about-woodstock'],
      }),
    ).toBe(true);
  });

  it('rejects duplicate intent IDs', () => {
    expect(
      isValidRequest({
        message: 'hi',
        discussedIntentIds: ['ask-about-guitar', 'ask-about-guitar'],
      }),
    ).toBe(false);
  });

  it.each(['Ask_About_Guitar', '<script>', ''])('rejects a malformed intent ID (%j)', (id) => {
    expect(isValidRequest({ message: 'hi', discussedIntentIds: [id] })).toBe(false);
  });

  it('rejects more intent IDs than the cap', () => {
    const ids = Array.from({ length: MAX_DISCUSSED_INTENTS + 1 }, (_, i) => `intent-${i}`);
    expect(isValidRequest({ message: 'hi', discussedIntentIds: ids })).toBe(false);
  });
});

describe('SendMessageResponseSchema', () => {
  it('accepts a fallback reply with null intent and area', () => {
    expect(
      SendMessageResponseSchema.safeParse({ reply: 'Whoa.', intentId: null, areaId: null }).success,
    ).toBe(true);
  });

  it('rejects a reply without the areaId field', () => {
    expect(SendMessageResponseSchema.safeParse({ reply: 'Whoa.', intentId: null }).success).toBe(
      false,
    );
  });
});
