/**
 * @file Types for the custom `VITE_*` environment variables read through `import.meta.env`.
 */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" to use the in-browser mock API instead of the real server. */
  readonly VITE_USE_MOCK?: string;
}
