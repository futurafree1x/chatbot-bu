# Client

React + TypeScript (strict) frontend for the Jimi Hendrix chatbot, built with Vite.
All conversation logic lives in the server; the client sends messages and displays replies.

## Scripts (run from `client/`, or from the repo root with `-w client`)

| Script                 | What it does                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Vite dev server. `/api/*` is proxied to the Express server on port 3001.                            |
| `npm run build`        | Type-check, then build to `dist/`.                                                                  |
| `npm run typecheck`    | TypeScript strict-mode check (NFR-18).                                                              |
| `npm run lint`         | ESLint, including JSDoc (NFR-19), no-HTML-rendering (NFR-13) and no-browser-storage (NFR-23) rules. |
| `npm test`             | Vitest + React Testing Library component tests.                                                     |
| `npm run format:check` | Prettier check (config in the repo root).                                                           |
