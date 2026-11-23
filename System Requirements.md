# Requirements – Jimi Hendrix Interactive Conversation

## Functional requirements

There are 38 functional requirements in seven groups: 23 Must, 13 Should and 2 Could. Endpoint paths are working names.

| ID | Requirement | Rationale | Priority | Verification | Source |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **1\. Chat input** |  |  |  |  |  |
| 1.1 | The system shall provide a text box that accepts messages of 1 to 100 characters. | Short questions match more reliably; the limit stops abuse. | Must | E2E | Team decision |
| 1.2 | The system shall display the number of characters remaining while the user types. | Users need warning before they hit the limit. | Should | Component | Nielsen (1994) |
| 1.3 | The system shall prevent the user from sending an empty or whitespace-only message. | Avoids pointless requests. | Must | Component | Team decision |
| 1.4 | The system shall send the message when the user presses Enter or selects the Send button. | Matches how people use messaging apps. | Must | E2E | Comparable apps |
| 1.5 | The system shall reveal two suggested questions when the user selects a "Need ideas?" button. | Suggestions are optional, so they stay hidden until asked for. | Should | E2E | Team decision |
| 1.6 | The system shall send a suggested question as the user's message when the user selects it. | Lets users start without typing. | Should | E2E | Team decision |
| **2\. Response matching** |  |  |  |  |  |
| 2.1 | The backend shall match each message to an intent in the JSON dialogue data using the team's own keyword-matching logic. | The core conversation must not use an LLM. | Must | Unit | Brief |
| 2.2 | The backend shall pick each reply at random from the matched intent's reply variants, weighted by the probability set for each variant. | Repeat questions get varied answers, e.g. favourite guitar: Stratocaster 70%, "whatever's around" 30%. | Must | Unit | Team decision |
| 2.3 | The backend shall match keywords regardless of letter case and punctuation. | "WOODSTOCK?" and "woodstock" mean the same. | Must | Unit | Team decision |
| 2.4 | The backend shall match a keyword of five or more letters when the typed word is within two character edits of it. | Users make typos, especially on phones. | Should | Unit | Levenshtein (1966) |
| 2.5 | The backend shall reply with an in-character redirect naming the available topics when no intent reaches the confidence threshold. | Every message gets a sensible reply, never a wrong guess. | Must | Unit, E2E | Team decision |
| 2.6 | The backend shall reply to questions about drug use with an in-character deflection back to his music. | Keeps sensitive topics out for a mixed-age audience. | Must | Unit | ILO 1 (ethics) |
| 2.7 | The backend shall reply to offensive messages with a calm in-character response that steers back to the conversation. | Handles any input without escalating. | Must | Unit | ILO 1 (ethics) |
| 2.8 | The backend shall reply in character to questions about events after 1970 without claiming knowledge of them. | Users will test the illusion; this keeps it consistent. | Should | Unit | Team decision |
| 2.9 | The backend shall reply to greetings, thanks and goodbyes with matching small-talk responses. | The fallback would feel wrong there. | Should | Unit | Team decision |
| **3\. Conversation content** |  |  |  |  |  |
| 3.1 | The dialogue data shall cover four topic areas: life story, famous gigs, guitars and technique, and music and albums. | Agreed scope for the conversation. | Must | Manual content review | Team decision |
| 3.2 | The dialogue data shall contain at least eight intents in each topic area. | Gives the conversation enough depth and variety. | Should | Unit (count check) | Rubric: UX, High First |
| 3.3 | The system shall support a new topic area added only by editing the JSON dialogue data, with no code changes. | More topics may be added later. | Should | Manual (add a test topic) | Brief: structured data |
| **4\. Conversation display** |  |  |  |  |  |
| 4.1 | The system shall display Jimi's opening greeting when the page loads. | Gives users a clear starting point. | Must | E2E | Team decision |
| 4.2 | The system shall display the session's messages in chronological order, with Jimi's and the user's messages styled distinctly. | Users can follow who said what. | Must | Manual, E2E | Rubric: UI Design |
| 4.3 | The system shall show a "Jimi is typing…" indicator for 0.5 to 1.5 seconds before each reply appears. | Makes the exchange feel like a conversation. | Should | E2E | Comparable apps |
| 4.4 | The system shall scroll the message list to the newest message after each message appears. | Keeps the latest reply visible on small screens. | Must | E2E | Rubric: Usability |
| 4.5 | The system shall clear the conversation when the page is refreshed or closed. | No saved history. | Must | E2E | Team decision; NFR-23 |
| 4.6 | The system shall provide a toggle that switches between light and dark themes. | Comfort and readability in different settings. | Should | E2E | Team decision |
| 4.7 | The system shall use the device's light or dark setting as the default theme. | Respects the user's existing preference. | Could | E2E | Team decision |
| 4.8 | The system shall provide a Sources page listing the historical sources used, in APA format. | Credibility; users can check facts. | Should | Manual | Team decision; ILO 1 |
| **5\. Backend API and data** |  |  |  |  |  |
| 5.1 | The backend shall validate all JSON dialogue data against a schema when the server starts. | Catches content errors before users see them. | Must | Unit | Brief: structured data |
| 5.2 | The backend shall return Jimi's reply in response to POST /api/messages containing the user's message. | Matching runs on the server, so frontend and backend are meaningfully integrated. | Must | Integration | Brief: FE/BE integration |
| 5.3 | The backend shall respond with HTTP 400 and a JSON error when a message is missing, empty or over 100 characters. | The server never trusts client-side checks. | Must | Integration | Rubric: Software Quality |
| 5.4 | The backend shall return the suggested questions in response to GET /api/suggestions. | Suggestions live in the data, not hard-coded in the UI. | Should | Integration | Team decision |
| 5.5 | The backend shall refuse to start if the variant probabilities of any intent do not add up to 100%. | A typo in the weights would silently skew or break replies. | Must | Unit | Team decision |
| 5.6 | The backend shall accept and validate the intent IDs already discussed with each message, returning 400 if they are invalid. | Supports progression without storing messages. | Must | Integration | NFR-23; Brief |
| **6\. Error handling** |  |  |  |  |  |
| 6.1 | The frontend shall display an in-character error message with a Retry button when a request fails or takes longer than 5 seconds. | Users are never stuck on a silent failure. | Must | E2E (mocked failure) | Template: robustness |
| 6.2 | The frontend shall disable the Send button while a reply is pending. | Prevents duplicate messages. | Must | E2E | Template: unexpected interactions |
| **7\. Conversation progression** |  |  |  |  |  |
| 7.1 | The backend shall answer a follow-up such as "tell me more" using the previous intent. | Earlier messages shape later replies. | Must | Unit, Integration | Brief |
| 7.2 | The system shall show which of the four topic areas the user has explored. | Shows progress; encourages exploration. | Must | E2E | Brief; Rubric: Interaction Design |
| 7.3 | The system shall show a one-off closing message once all four topic areas are explored. | Gives the conversation an ending. | Should | Integration, E2E | Team decision |
| 7.4 | The backend shall acknowledge a repeated question before answering it. | Jimi seems aware of the conversation. | Could | Unit | Team decision |

## Non-functional requirements

There are 23 non-functional requirements, grouped by ISO/IEC 25010:2023 quality characteristic: 15 Must and 8 Should. Each has a pass/fail target for the Testing section to report against.

| ID | Requirement | Measurable target / standard | Rationale | Priority | Verification | Source |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **Usability and accessibility** |  |  |  |  |  |  |
| NFR-1 | Both themes shall conform to WCAG 2.2 Level AA. | 0 serious or critical issues in an axe scan; text contrast at least 4.5:1 (SC 1.4.3) in light and dark mode. | Some users have visual, motor or cognitive impairments; AA is the UK public-sector benchmark. | Must | axe DevTools, contrast checker | WCAG 2.2 |
| NFR-2 | Every control shall be operable by keyboard alone, with a visible focus indicator. | Text box, Send, Need ideas, suggestions and theme toggle all reachable by Tab and Enter (SC 2.1.1, 2.4.7). | Supports keyboard and switch users. | Must | Manual keyboard walkthrough | WCAG 2.2 |
| NFR-3 | Screen readers shall announce each new reply from Jimi. | Message list is an aria-live="polite" region; text box has an accessible label; tested with NVDA or VoiceOver. | Without a live region, replies are never read aloud. | Must | Manual screen-reader test | WCAG 2.2 SC 4.1.3 |
| NFR-4 | The layout shall adapt to phone, tablet and desktop widths. | No horizontal scroll at 360, 768 and 1280 px; touch targets at least 24×24 px (SC 2.5.8); text box stays visible with the on-screen keyboard open. | Many users will be on phones. | Must | Device emulation, E2E at 3 widths | Rubric: Usability and Responsiveness |
| NFR-5 | The typing indicator shall respect the user's reduced-motion setting. | No animation when prefers-reduced-motion is set; a static "Jimi is typing…" label instead. | Animation can cause discomfort. | Should | Manual test with the OS setting on | WCAG 2.2 |
| NFR-6 | First-time users shall get on-topic answers without help. | At least 4 of 5 test users get an on-topic reply in each of the four topic areas within 5 minutes; mean SUS score at least 68\. | Shows the app is usable, not just functional. | Should | Moderated user test \+ SUS questionnaire | Brooke (1996) |
| **Performance efficiency** |  |  |  |  |  |  |
| NFR-7 | The backend shall match messages quickly. | 95% of 500 test requests answered within 200 ms, not counting the typing-indicator delay. | Matching should never be the bottleneck. | Should | Automated load test (500 requests) | Team decision |
| NFR-8 | The production build shall load quickly on mobile. | Lighthouse Performance score at least 90 (mobile profile); LCP at most 2.5 s. | Phone users on slower connections. | Should | Lighthouse report | Core Web Vitals |
| **Matching quality** |  |  |  |  |  |  |
| NFR-9 | The matcher shall route on-topic messages to the correct intent. | At least 85% of a labelled set of 150+ on-topic messages (100 characters or fewer, written by people outside the team) matched correctly. | Makes "an appropriate response" measurable. | Must | Automated test set in CI | Brief: own conversational logic |
| NFR-10 | The matcher shall send off-topic messages to the fallback rather than a wrong answer. | At least 90% of 50+ off-topic test messages get the in-character redirect. | A wrong confident answer is worse than a redirect. | Must | Automated test set in CI | Team decision |
| NFR-11 | Reply selection shall follow the probabilities set in the dialogue data. | Over 10,000 simulated picks for a tested intent, each variant's share is within 2 percentage points of its set probability; the random source can be seeded for repeatable tests. | Proves the weighting works as designed. | Must | Unit test | Team decision |
| **Security** |  |  |  |  |  |  |
| NFR-12 | The backend shall validate every request before use. | Body must be a string of 1–100 characters; request body limit 1 KB; invalid input returns 400 with no stack trace. | Never trust the client. | Must | Integration tests with invalid payloads | OWASP A05:2025 Injection |
| NFR-13 | Message text shall be rendered as plain text only. | No dangerouslySetInnerHTML anywhere; a typed script tag displays as literal text. | Prevents cross-site scripting. | Must | Code review, E2E with XSS payloads | OWASP A05:2025 Injection |
| NFR-14 | The message endpoint shall limit request rates. | More than 30 messages a minute from one client returns HTTP 429\. | Stops spam and denial of service. | Should | Integration test | OWASP API4:2023 |
| NFR-15 | The deployment shall be securely configured. | No secrets in the repo or client bundle; helmet security headers on; CORS limited to the frontend origin. | Reduces the attack surface. | Must | Secret scan, header check | OWASP A02:2025 |
| NFR-16 | Dependencies shall be free of known high-severity vulnerabilities at submission. | npm audit reports 0 high or critical issues; lockfile committed; install scripts allowlisted. | Supply-chain risk. | Should | npm audit in CI | OWASP A03:2025 |
| **Reliability** |  |  |  |  |  |  |
| NFR-17 | Every message within the limit shall get a reply, and no error shall crash the app. | 1,000 fuzzed inputs (emoji, other languages, code, exactly 100 characters) all get a reply; 0 server crashes; a React error boundary shows a fallback screen. | Users can type anything. | Must | Fuzz test, forced-error test | OWASP A10:2025 |
| **Maintainability** |  |  |  |  |  |  |
| NFR-18 | All code shall compile under TypeScript strict mode with no lint errors. | strict: true; ESLint and Prettier report 0 errors in CI. | Consistent code across authors. | Must | CI lint and type-check job | Brief: good coding practices |
| NFR-19 | Every exported function, component and module shall have a JSDoc comment. | 100% of exports documented (eslint-plugin-jsdoc rule). | The rubric's High First band names JSDoc explicitly. | Should | Lint rule in CI | Rubric: Implementation Quality |
| NFR-20 | Automated tests shall gate every merge to main. | At least 70% statement coverage on the matching engine; all tests pass in GitHub Actions before merge. | Evidence of systematic testing. | Should | CI coverage report, branch protection | Rubric: Software Quality |
| **Legal and ethical** |  |  |  |  |  |  |
| NFR-21 | Every factual reply shall be traceable to a cited source. | Each fact-bearing reply carries a source ID linked to an APA reference; every reply reviewed by a second team member. | Historical accuracy. | Must | Script check of source IDs; PR review | ILO 1 |
| NFR-22 | The app shall not reproduce copyrighted lyrics, recordings or images. | 0 lyric lines or audio clips; images public domain or CC-licensed with attribution. | Lawful use of third-party material. | Must | Manual content audit | CDPA 1988 |
| NFR-23 | User messages shall not be stored anywhere. | No message text on the server, in logs, in cookies or in browser storage; only intent IDs held, in browser memory; the request logger does not log request bodies. | Data minimisation; no saved history. | Must | Code review, log and storage inspection | UK GDPR Art. 5(1)(c) |

&nbsp;