import {
  SendMessageResponseSchema,
  SourcesResponseSchema,
  StartResponseSchema,
  SuggestionsResponseSchema,
} from '@hendrix/shared';
import { describe, expect, it } from 'vitest';
import { createMockApi } from './mockApi';

const api = createMockApi({ latencyMs: 0 });

describe('createMockApi', () => {
  it('returns data that satisfies the shared contract', async () => {
    expect(StartResponseSchema.safeParse(await api.start()).success).toBe(true);
    expect(SuggestionsResponseSchema.safeParse(await api.getSuggestions()).success).toBe(true);
    expect(SourcesResponseSchema.safeParse(await api.getSources()).success).toBe(true);
    const reply = await api.sendMessage({ message: 'guitar?', discussedIntentIds: [] });
    expect(SendMessageResponseSchema.safeParse(reply).success).toBe(true);
  });

  it('answers a keyword with its intent and area', async () => {
    const reply = await api.sendMessage({
      message: 'Tell me about WOODSTOCK!',
      discussedIntentIds: [],
    });
    expect(reply).toMatchObject({ intentId: 'ask-about-woodstock', areaId: 'famous-gigs' });
  });

  it('falls back with null intent and area when nothing matches', async () => {
    const reply = await api.sendMessage({ message: 'quantum physics', discussedIntentIds: [] });
    expect(reply).toMatchObject({ intentId: null, areaId: null });
  });

  it('rejects an invalid request with a 400, like the server (FR 5.3)', async () => {
    await expect(api.sendMessage({ message: '   ', discussedIntentIds: [] })).rejects.toMatchObject(
      {
        kind: 'http',
        status: 400,
        code: 'INVALID_MESSAGE',
      },
    );
    await expect(
      api.sendMessage({ message: 'hi', discussedIntentIds: ['NOT VALID'] }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_INTENT_IDS' });
  });

  it('sends the closing message only on the reply that completes every area (FR 7.3)', async () => {
    const threeAreas = ['ask-about-childhood', 'ask-about-woodstock', 'ask-about-guitar'];

    const completing = await api.sendMessage({
      message: 'albums?',
      discussedIntentIds: threeAreas,
    });
    expect(completing.closing).toBeDefined();

    const afterwards = await api.sendMessage({
      message: 'albums again?',
      discussedIntentIds: [...threeAreas, 'ask-about-albums'],
    });
    expect(afterwards.closing).toBeUndefined();
  });

  it('does not count untracked small talk towards progress', async () => {
    const reply = await api.sendMessage({
      message: 'hello',
      discussedIntentIds: ['ask-about-childhood', 'ask-about-woodstock', 'ask-about-guitar'],
    });
    expect(reply.closing).toBeUndefined();
  });
});
