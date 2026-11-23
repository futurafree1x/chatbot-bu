import type { Intent } from '@hendrix/shared';

export function findIntent(message: string, intents:Intent[]): Intent | undefined 
{
    const words = message.toLowerCase().split(/[^a-z0-9]+/); // splits sentences by characters that aren't a letter or digits to find keywords
    return intents.find((intent) => intent.keywords.some((keyword) => words.includes(keyword))); // returns the first intent to pass the test that has at least one keyword
}