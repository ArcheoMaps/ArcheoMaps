# Scribe Curator v0.3.2 — verification record

Date: 2026-09-18

## v0.3.2 decision-history update

- `node tests/logic-regression.js`: **10 passed, 0 failed**.
- Inline `index.html` JavaScript parse check: **passed**.
- `node --check service-worker.js`: **passed**.
- `node --check tests/regression.js`: **passed**.
- JSON parsing for the manifest, package files, and every fixture: **passed**.
- The browser suite now contains **15 checks**. Two new Playwright checks cover re-judging a reviewed location without moving the active queue position, plus cancelling a historical draft without leaking changes into IndexedDB. They were added and syntax-checked here, but were **not executed in this packaging environment because its Playwright Chromium binary is unavailable**. The pre-existing 13 browser checks remain recorded below as having passed against v0.3.1; they are not relabelled as v0.3.2 results.

The v0.3.2 implementation makes the three outcome counters interactive, lists previously reviewed locations by outcome, and lets a reviewer revise one in an isolated draft. Committing updates the old/new counters and resolved proposal decisions, then returns to the untouched queue position. Cancelling restores the complete location snapshot. Draft edits are deliberately excluded from autosave and exports until committed so a reload can only recover the last internally consistent session.

## Previously passed in the v0.3.1 packaging environment (ChatGPT, no Chromium available)

- `node tests/logic-regression.js`: **10 passed, 0 failed**.
- Inline `index.html` JavaScript parse check: **passed**.
- `node --check service-worker.js`: **passed**.
- JSON parsing for the manifest, package files, and all fixtures: **passed**.
- Archive integrity and SHA-256 were checked after packaging and reported with that deliverable.

The logic suite executes the application's actual inline functions (not a reimplementation) in a Node `vm` sandbox with inert DOM shims. It covers prototype-shaped IDs, delimiter-collision group keys, multi-identity rejection, malformed nested fields, all-low and mixed competing-group defaults, mandatory saved-state maps, integer cursors, derived counters, group membership, and decision consistency.

## v0.3.1 re-run and extension with a real browser (Claude, Chromium available)

The packaging environment was honest that it couldn't run the Playwright browser suite. This environment can, so it was actually run rather than left as an open claim:

- `node tests/logic-regression.js`: **10 passed, 0 failed** (re-confirmed against this exact archive).
- `node tests/regression.js`: **13 passed, 0 failed** — the same 12 browser checks from the first audit-fix pass (C-01, C-02, C-03, H-01 through H-06, M-01, M-07, L-04), all still green against v0.3.1, plus one new check added while verifying this version specifically:
  - **v0.3.1: reset wins a race against a pending autosave, no stale resurrection** — accepts a card (queuing a debounced 250ms autosave), immediately triggers "Start a new session," and reads IndexedDB directly afterward rather than trusting the UI. This is the one claim in this version ("serialized autosaves, no stale writes after reset") that genuinely needed a live browser + real IndexedDB to check, since it's a timing race — the logic suite's `vm` sandbox doesn't have real `setTimeout` scheduling against a real database. It passed: no reviewed-card data survives a reset that lands mid-debounce.
- Rendered touch-target sizes were also spot-measured directly (not just read from CSS): pill-toggle 52×44, `#btnUndo`/`#btnSkip`/`data-all` 44×44, evidence-toggle 44px tall. All meet the 44×44 minimum as claimed.
- The two independent test suites (this one and the original audit-fix pass's) were written separately and agree — the earlier suite still passes unmodified against this version, which is itself a useful cross-check that v0.3.1 didn't quietly regress anything the first pass fixed.

The dialog-handling helper in `tests/regression.js` (`freshPage(opts)`) was extended with an `acceptDialogs` option to make the new reset-race test possible — the original comment referenced "a one-shot override" for tests needing to accept a confirm(), but no such mechanism actually existed yet.

## Still not executed anywhere (real hardware/infrastructure required)

- Real phone gesture feel (drag physics tuning).
- A true two-deployment service-worker upgrade cycle (the "already-waiting worker" fix is code-reviewed and logically sound, but exercising it end-to-end needs two actual served versions, which a single static-file-server run can't produce).
- Desktop-Scribe round-trip validation — no desktop app exists in this repo to round-trip with.
- True on-device performance at an oversized batch (the size-confirmation prompt itself is covered by the logic suite).
