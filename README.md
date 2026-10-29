# Brain Training Quiz

A dark-mode brain-training app with five-question sessions, three activities, and private saved progress. The core is vanilla HTML, CSS, and JavaScript in a single offline `index.html`; the hosted companion adds private cloud sync.

[Public app](https://brain-training-quiz.sceon-4149.chatgpt.site) · [Source repository](https://github.com/m-grigoryan/brain-training-quiz)

## Activities

- **Brain Training Quiz:** seven exercise types, three difficulty levels, and worked examples. Sort Digits, Mixed Sorting, and Transform Digits have eight-second memorization. Reverse Digits and Dual Task use difficulty-based memorization. Rule hints remain visible after the sequence hides. Answers have no time limit.
- **Math Practice:** choose addition, subtraction, multiplication, and/or exact division. Addition/subtraction begin at four digits; multiplication/division at one digit. Each correct answer increases that operation's level within the session. Future starting levels use the saved correctness pattern.
- **Number Flow:** choose operations, keep a running total as a new step appears every three seconds, and answer after the sequence. Five rounds per session. A perfect session gently raises the next session's level; difficulty remains fixed within a session.

## Sign-in, synced progress, and privacy

The public app supports **Sign in with ChatGPT**. Signed-in session history, questions, answers, correctness, difficulty, and resumable progress sync to a private Cloudflare D1 record scoped to that account. Guests can still play and save only in their browser.

- Each cloud request is authorized server-side using Sites' authenticated user ID. A visitor cannot select another user's record.
- Cloud writes use atomic revisions. Conflicting device updates are merged and retried instead of silently replacing newer answers.
- Quiz, Math Practice, and Number Flow histories remain separate. Their scores and adaptation use the same merged history across devices.
- Existing guest progress is uploaded only when the visitor chooses **Add browser progress & sync**. **Use cloud history only** keeps the guest history separate.
- Signing out or changing accounts switches the browser's active progress scope. Previously cached history is preserved separately and is not uploaded into another account.
- Offline answers are saved in the browser and synced when connectivity returns or the account is reopened. Unsynced browser data can be lost if site storage is cleared, so keep backups.
- **Quiz history → Export backup / Import backup** supports all three activities. To move old localhost progress, export it locally, then import it while signed in on the public app.
- Site updates at the same address preserve local and cloud progress. No personal sessions or exported backups are committed to this repository.

The single `index.html` remains an offline app. Cloud sync is supplied by the hosted server files; opening the HTML directly does not require an account or backend.

### How difficulty adapts

The quiz starts in adaptive mode for new visitors. Each exercise learns separately from completed-session answers. At least five relevant answers are needed; at least 80% correct moves up one level, and 40% or less moves down. The latest ten relevant answers form the evidence window. Changes take effect in future sessions. Manual difficulty and existing saved preferences remain available.

Math Practice similarly recommends each operation's next starting digit level. Correct answers at or above the current recommended level count as evidence; incorrect answers at a harder level do not falsely imply failure at the easier level. Five relevant answers and the same 80% / 40% thresholds apply. Starting recommendations are recorded with each session so older histories remain valid.

Number Flow uses its own six-level progression. Five correct rounds raise selected operations one level for the next session. Multiplication/division use small factors and gentler growth.

## Run locally

Open `index.html` in a modern browser. For stable browser storage, use the same localhost address each time:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8765/`. No build step, dependencies, CDN, or backend is required.

## Hosted version

The full app is deployed through Sites with ChatGPT sign-in and a Cloudflare D1 database. GitHub stores the public source; GitHub Pages alone cannot run the sign-in/sync backend.

- `index.html`: canonical standalone interface and exercise logic.
- `app/route.ts`: serves that exact HTML in the hosted version.
- `app/api/identity/route.ts`: optional signed-in identity.
- `app/api/progress/route.ts` and `cloud/progress-server.mjs`: authenticated, account-scoped sync.
- `db/schema.ts` and `drizzle/`: versioned schema migrations; no personal database contents.
- `.openai/hosting.json`: non-secret deployment identity and database binding.

For full-stack local development, use Node.js 24+, install locked dependencies, run `npm run db:generate` only after schema changes, build, apply pending local D1 migrations, and run `npm run dev -- --port 5179 --hostname 127.0.0.1`. The Sites starter provides development-only mock sign-in on loopback; production uses platform authentication.

## Tests

Development tests use Node.js built-ins and isolated in-memory storage; they never write personal browser history:

```sh
node tests/generation-tests.cjs
node tests/state-tests.cjs
node tests/learning-tests.cjs
node tests/game-tests.cjs
node tests/number-flow-tests.cjs
node tests/five-question-tests.cjs
node tests/home-navigation-tests.cjs
node tests/adaptive-math-tests.cjs
node tests/cloud-sync-tests.mjs
```

The generation suite checks 27,000 questions, including retired types retained solely to support old saved histories. Number Flow checks 9,000 plans across all operation subsets and levels. State checks cover timer expiration, stale callbacks, hidden content, duplicate scoring, results, and resume behavior.

## Data compatibility

Stable local storage keys are preserved:

- `brain-training-learning-library-v1`
- `brain-training-question-signatures-v2`
- `brain-training-arithmetic-games-v1`
- `brain-training-number-flow-v1`

Swap Positions and Missing Element are excluded from new quizzes; existing saved sessions containing them remain reviewable.
