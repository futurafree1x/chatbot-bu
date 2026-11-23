//CLAUDE GENERATED

import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { DialogueSchema, type Dialogue } from '@hendrix/shared';

/** Where the dialogue file lives, relative to this file. */
const DIALOGUE_FILE = new URL('./dialogue.json', import.meta.url);

/**
 * Reads Jimi's dialogue from JSON and checks it against the schema (FR 5.1, FR 5.5).
 * Throws an error describing every problem if the file is missing, not valid JSON,
 * or does not match the schema, so the server refuses to start with bad content.
 *
 * @param file - The file to load. Defaults to `dialogue.json` next to this module.
 * @returns The validated dialogue, with defaults filled in.
 */
export function loadDialogue(file: URL = DIALOGUE_FILE): Dialogue {
  const raw = readFileSync(file, 'utf8');

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Dialogue file is not valid JSON: ${(error as Error).message}`);
  }

  const result = DialogueSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Dialogue file is invalid:\n${z.prettifyError(result.error)}`);
  }

  return result.data;
}