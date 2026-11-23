import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './chatApi';
import { createHttpApi, REQUEST_TIMEOUT_MS } from './httpApi';

/** A fake `fetch` that always answers with the given status and JSON body. */
function fetchReturning(status: number, body: unknown) {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }));
}

/** A fake `fetch` that never answers, but rejects (like the real one) when aborted. */
const hangingFetch: typeof fetch = (_input, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () =>
      reject(new DOMException('The operation was aborted.', 'AbortError')),
    );
  });

const validReply = { reply: 'I play a Strat.', intentId: 'ask-about-guitar', areaId: 'guitars' };

describe('createHttpApi', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('POSTs the message and discussed intent IDs as JSON (FR 5.2, 5.6)', async () => {
    const fetchFn = fetchReturning(200, validReply);
    const api = createHttpApi({ fetchFn });

    const result = await api.sendMessage({
      message: 'guitar?',
      discussedIntentIds: ['ask-about-woodstock'],
    });

    expect(result).toEqual(validReply);
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('/api/messages');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({
      message: 'guitar?',
      discussedIntentIds: ['ask-about-woodstock'],
    });
  });

  it('turns a 400 error body into an http ApiError with its code (FR 5.3)', async () => {
    const api = createHttpApi({
      fetchFn: fetchReturning(400, {
        error: { code: 'INVALID_MESSAGE', message: 'Message must be 1-100 characters.' },
      }),
    });

    await expect(api.sendMessage({ message: 'x', discussedIntentIds: [] })).rejects.toMatchObject({
      kind: 'http',
      status: 400,
      code: 'INVALID_MESSAGE',
    });
  });

  it('still reports the status when an error body is not in the contract format', async () => {
    const api = createHttpApi({ fetchFn: fetchReturning(500, 'Internal Server Error') });

    await expect(api.getSuggestions()).rejects.toMatchObject({
      kind: 'http',
      status: 500,
      code: undefined,
    });
  });

  it('rejects a 200 response that breaks the contract (NFR-17)', async () => {
    const api = createHttpApi({ fetchFn: fetchReturning(200, { reply: 42 }) });

    await expect(api.sendMessage({ message: 'hi', discussedIntentIds: [] })).rejects.toMatchObject({
      kind: 'invalid-response',
    });
  });

  it('reports a network failure', async () => {
    const api = createHttpApi({
      fetchFn: vi.fn<typeof fetch>(async () => {
        throw new TypeError('Failed to fetch');
      }),
    });

    await expect(api.start()).rejects.toMatchObject({ kind: 'network' });
  });

  it(`times out after ${REQUEST_TIMEOUT_MS} ms (FR 6.1)`, async () => {
    vi.useFakeTimers();
    const api = createHttpApi({ fetchFn: hangingFetch });

    let outcome: unknown = 'pending';
    api.sendMessage({ message: 'hi', discussedIntentIds: [] }).catch((error: unknown) => {
      outcome = error;
    });

    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS - 1);
    expect(outcome).toBe('pending');

    await vi.advanceTimersByTimeAsync(1);
    expect(outcome).toBeInstanceOf(ApiError);
    expect(outcome).toMatchObject({ kind: 'timeout' });
  });
});
