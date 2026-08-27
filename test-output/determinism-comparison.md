# Determinism Comparison — generate-review-queue.js

Generated: 2026-08-26T17:17:11.345Z

Two independent, back-to-back invocations of `generate-review-queue.js` against the same read-only inputs:

| | Run 1 | Run 2 |
|---|---|---|
| itemCount | 62 | 62 |
| queueFingerprint | `cd0e05a782479b02372cd0ae75da58d3d53b54a667b0d3e7218c4ce621948b9e` | `cd0e05a782479b02372cd0ae75da58d3d53b54a667b0d3e7218c4ce621948b9e` |
| generatedAt (excluded from fingerprint, differs by design) | 2026-08-26T17:17:10.774Z | 2026-08-26T17:17:10.935Z |

**Result: IDENTICAL ✅** — byte-identical output excluding the informational `generatedAt` timestamp.

Source file integrity (sha256 before vs. after both runs):

| File | sha256 |
|---|---|
| archeomaps_data_unesco_enriched_corrected.json | `cf63aa182c04af36e05b04f086c972d638e65788b7b12d12aff80b19d0968c5d` (unchanged) |
| unesco_likely_existing_records.json | `f546f711e6cb6dcae677a90964385d194f53631a112360701f2776bea7a0588b` (unchanged) |

