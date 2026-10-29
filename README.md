# Brain Training Quiz

A dark-mode brain-training app with five-question sessions, three activities, and private saved progress. Built with vanilla HTML, CSS, and JavaScript in a single offline `index.html`. The public GitHub Pages version saves progress in your browser.

[Public app](https://m-grigoryan.github.io/brain-training-quiz/) · [Source repository](https://github.com/m-grigoryan/brain-training-quiz)

## Activities

- **Brain Training Quiz:** seven exercise types, three difficulty levels, and worked examples. Sort Digits, Mixed Sorting, and Transform Digits have eight-second memorization. Reverse Digits and Dual Task use difficulty-based memorization. Rule hints remain visible after the sequence hides. Answers have no time limit.
- **Math Practice:** choose addition, subtraction, multiplication, and/or exact division. Addition/subtraction begin at four digits; multiplication/division at one digit. Each correct answer increases that operation's level within the session. Future starting levels use the saved correctness pattern.
- **Number Flow:** choose operations, keep a running total as a new step appears every three seconds, and answer after the sequence. Five rounds per session. A perfect session gently raises the next session's level; difficulty remains fixed within a session.

## Browser-local history and backups

The GitHub Pages edition uses **browser-local storage**, as requested. It makes no sign-in or cloud-sync requests and does not upload your answers. Quiz, Math Practice, and Number Flow keep separate histories, scores, and difficulty progress.

- Sessions save questions, submitted answers, correctness, difficulty, dates, and resumable progress in this browser.
- Updates at this same website address preserve local history. Clearing site data or switching browsers does not.
- **Quiz history → Export backup** includes all three activities. Use **Import backup** on another browser/device to merge them without replacing existing history.
- To move earlier localhost or cloud-hosted progress here, export a backup from that earlier app, then import it into the GitHub Pages app. Earlier data and the previous deployment are not deleted.
- No account or automatic cross-device sync is used in this edition. Existing server source is retained for compatibility and possible future optional hosting; it is not needed or deployed by GitHub Pages.
- Never commit personal backup files, database contents, or browser storage to this public repository.

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

## GitHub Pages deployment

The public app is **https://m-grigoryan.github.io/brain-training-quiz/**. In repository Settings → Pages, publish `main` from `/ (root)`. The `.nojekyll` file keeps this a static deployment. No build step or backend is needed.

GitHub chooses the hostname from the owner account: `braintraining.github.io` requires ownership of the `braintraining` GitHub account or organization. Naming a repository that way does not change the owner hostname.

`index.html` is the canonical standalone app. The retained `app/`, `cloud/`, `db/`, and deployment-helper files belong to the earlier optional cloud deployment. The GitHub Pages edition has `ENABLE_CLOUD_SYNC=false`; those backend routes do not run on GitHub Pages.

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
node tests/static-hosting-tests.cjs
```

The generation suite checks 27,000 questions, including retired types retained solely to support old saved histories. Number Flow checks 9,000 plans across all operation subsets and levels. State checks cover timer expiration, stale callbacks, hidden content, duplicate scoring, results, and resume behavior.

## Data compatibility

Stable local storage keys are preserved:

- `brain-training-learning-library-v1`
- `brain-training-question-signatures-v2`
- `brain-training-arithmetic-games-v1`
- `brain-training-number-flow-v1`

Swap Positions and Missing Element are excluded from new quizzes; existing saved sessions containing them remain reviewable.
