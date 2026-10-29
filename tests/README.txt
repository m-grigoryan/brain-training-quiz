Brain Training Quiz — development checks

The application is ../index.html. It has no dependencies and opens directly in a modern browser while offline.
These tests are development-only and are never loaded by the app.

Random generation and engine tests (Node.js built-ins only):
  node tests/generation-tests.cjs

Browser acceptance tests (development dependency: Playwright with Chromium):
  node tests/browser-tests.cjs
To use a separately installed Chrome, set BRAIN_TRAINING_CHROME_PATH to its executable path.
Browser tests write screenshots to tests/artifacts/.

Verified in this build:
- 27,000 randomly generated questions: 1,000 for every exercise at every difficulty.
- Independent answer calculation; all four operators; illegal arithmetic rejection.
- Difficulty counts, lengths, element preservation, sorting, unique missing digits,
  disjoint swaps, nonnegative transforms, separated and compact answer formats.
- All nine difficulty/count combinations: 180 fully completed questions.
- Four Dual Task correctness combinations; locked arithmetic and mandatory recall.
- Exact scoring, final denominator, early completion, review and filters.
- Real 7-second countdown, stale timer rejection after restart, unlimited answer stages.
- Memory concealment, ordinary hide/show and retained answer text.
- Balanced all-nine schedules, unique signatures, local history capped at 1,000.
- Offline file opening, no external requests, and denied-storage fallback.
- Desktop and narrow layouts, navigation guard, and no browser script errors.

Final specification alignment:
- Canonical compact transformed answers are accepted even when numeric grouping is ambiguous.
- Explicitly separated transformed answers are checked element by element.
- Malformed comma patterns and non-Latin characters are rejected before normalization.
- Section 14's exact-length validation is used when sequence-length rules conflict:
  wrong-length sequences remain editable and do not count as completed answers.
- Mixed Sorting rejects already sorted source sequences.
- Named generator and validation APIs, stored instructions, and intermediate results are checked.
- Generation is bounded to 100 attempts, with a controlled failure message.
- Hide/Show works during memorization and recall without restoring expired original digits.
- Rapid/repeated Enter is guarded; Enter can submit and advance after feedback.
- Desktop has no on-screen keypad; narrower layouts retain it.

Additional no-dependency state checks:
  node tests/state-tests.cjs
These complete 180 questions in all 9 difficulty/count configurations using a virtual clock.
They test five-minute answering delays, dual components, stale callbacks, stage guards,
scoring invariants, input retention, keyboard repeats, and question review.

Current browser walkthrough: completed an offline local quiz through all nine types.
Deliberately incorrect Dual Task arithmetic plus correct recall produced 9/10, 90%,
and one incorrect result. The review filter showed only that Dual Task.
Also checked real countdowns, protected hide/show, leading zeros, lowercase letters,
malformed commas, compact multi-digit transformation input, and desktop keypad removal.

Local learning edition:
  node tests/learning-tests.cjs

Verified:
- Worked examples for all nine exercises, separate from current questions.
- Per-answer saves, saved drafts, completed history, and interrupted-session archival.
- Reload/resume of feedback and locked Dual Task arithmetic.
- Expired memorization cannot be replayed after reload.
- Import validates question mathematics, answer formats, scores, and stage safety.
- Backup import merges session IDs without duplicating or replacing existing records.
- Adaptive difficulty promotes/demotes each exercise independently and is retained on reload.
- Browser walkthrough confirmed worked examples, answer persistence after reload,
  session resume, completed History, and saved adaptive settings.
- Mac launcher passed shell and Python syntax checks. The local preview server was
  verified separately; launcher opens the same fixed loopback address for stable storage.

Three-session audit regressions (Node built-ins only):
  node tests/audit-regressions.cjs
See AUDIT-2026-10-28.txt for the browser walkthrough and fixes.

Arithmetic-game checks:
  node tests/game-tests.cjs
4,000 independent randomized game questions, covering all four operators and
levels up to 32 digits. Checks progression, exact large integers, malformed input,
unchecked operations, duplicate submissions, incorrect-answer levels, save/resume,
separate history, and backup import/recovery. Browser walkthrough tested all four
starting levels, correct/wrong feedback, reload/resume, and ending a game by Enter.

Home navigation: node tests/home-navigation-tests.cjs
Checks home choices, math start/back/resume/results, separate histories, quiz
start and independent storage using isolated data.

Number Flow and memory hints: node tests/number-flow-tests.cjs
9,000 plans across all operator subsets and 6 levels; 8-second hints and
concealment; stale timers, resume, scores, separate storage, fixed session levels.
