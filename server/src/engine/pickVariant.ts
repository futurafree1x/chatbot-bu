import type { Variant } from '@hendrix/shared';

/**
 * Picks one reply variant at random, using each variant's weight as its
 * percentage chance (FR 2.2). Weights are guaranteed to total 100 by the schema.
 *
 * @param variants - The variants to choose from (weights add up to 100).
 * @param random - Returns a number from 0 (inclusive) to 1 (exclusive).
 *   Defaults to Math.random; tests pass their own to get repeatable results (NFR-11).
 * @returns The chosen variant.
 */
export function pickVariant(variants: Variant[], random: () => number = Math.random): Variant {
  const roll = random() * 100;
  let cumulative = 0;

  for (const variant of variants) {
    cumulative += variant.weight;
    if (roll < cumulative) {
      return variant;
    }
  }

  // Only reached if rounding leaves roll just under 100: fall back to the last variant.
  return variants[variants.length - 1];
}