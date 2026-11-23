/**
 * @file Chooses which `ChatApi` the app uses.
 *
 * Set `VITE_USE_MOCK=true` in `client/.env.development` to use the in-browser mock; set it to
 * `false` (or remove it) to call the real server. That one line is the only change needed.
 */
import type { ChatApi } from './chatApi';
import { createHttpApi } from './httpApi';
import { createMockApi } from './mockApi';

/** The API instance the whole app shares. */
export const api: ChatApi =
  import.meta.env.VITE_USE_MOCK === 'true' ? createMockApi() : createHttpApi();

export { ApiError } from './chatApi';
export type { ApiErrorKind, ChatApi } from './chatApi';
