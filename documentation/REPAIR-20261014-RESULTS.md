# Pixelframe 0.1.7 repair — 14 October 2026

This is an incremental repair of the existing Pixelframe bundle. Siteframe and the old checkout were not edited. The bundle is not a Git repository.

## Verified delivery

- Build and typecheck pass. See test-results/offline-final.log for the full offline run, test-results/build.json for installed destinations.
- Existing chrome-extension and figma-plugin folders rebuilt; reload the same extension folder, close the old studio tab, reopen it, and reconvert. Existing Figma frames do not update automatically.
- 24 font families, 268 weight/slant catalog entries, 68 physical font files. All 68 loaded using real browser FontFace; individual Figma availability remains unverified.
- Browser conversion completed: 34 text layers, 5 native shapes, 5 raster regions, 14 text layers flagged for review. This differs from Skia; do not mix the metrics.
- Real browser group replacement, >5% width warning, export, and preservation of that override through the production importer in an API mock were checked. No new native Figma frame was imported.

## Before / after — automatic offline packages

Baseline is the immutable saved automatic package set. Fresh runs use unchanged .4 review, .85 flat reject and .4 smooth-background reject thresholds. OCR and renderer differences mean these are overall pipeline measurements, not isolated font-family accuracy.

| Sample | Near-empty images | Images | Invisible shapes | Image rectangle area % | Text layers | Review % | Median matchError |
|---|---:|---:|---:|---:|---:|---:|---:|
| user-41b467 | 17 → 0 | 26 → 5 | 3 → 0 | 159.39 → 103.08 | 36 → 37 (37 source lines) | 58.33 → 56.76 | 0.4169 → 0.3832 |
| automotive | 9 → 0 | 39 → 2 | 1 → 0 | 68.39 → 104.76 | 51 → 57 (57 source lines) | 82.35 → 85.96 | 0.4627 → 0.4696 |
| dark | 19 → 0 | 33 → 6 | 0 → 0 | 41.80 → 24.40 | 15 → 15 (16 source lines) | 13.33 → 26.67 | 0.2568 → 0.3395 |
| travel | 10 → 0 | 29 → 8 | 0 → 0 | 45.55 → 56.03 | 24 → 25 (25 source lines) | 16.67 → 12.00 | 0.3303 → 0.3202 |

Per-layer fresh pixel-error measurements: test-results/font-accuracy.json. All four fresh packages pass zero-vacant/zero-invisible/≤110% rectangle-area checks. A pixel has one image owner; small transparent bounding-box overlap is allowed to avoid hundreds of fragments.

## What changed

- Alpha ≥24 visibility, 24-pixel/2% crop minimum, conservative noise opening, source-space raster partitioning, same-surface shape pruning, visible cap warnings and stable z order.
- Licensed subset font catalog with metrics, real variable/italic loading, compact morphology shortlist and broader search for uncertain matches. Top-five alternatives exported. OCR ambiguities are suggestions, not automatic substitutions.
- Compatible adjacent text lines can merge with measured baseline rhythm and alignment. Source line breaks are preserved because a screenshot cannot establish which breaks were hard vs browser wrapping. Mixed-style ranges are supported by model/importer; automatic mixed-style inference is not implemented.
- Group/per-layer font overrides preserve ink location, store metadata, and warn for width changes. Original match scores are retained; manual edits are not mislabeled as newly verified matches.
- Importer resolves fonts before constructing frames, keeps a visible report, caches fonts including style runs, skips individual failed layers, preserves prior artwork, and reports weak text. PNG decoder text codecs work without browser TextEncoder/TextDecoder globals.
- Icons and two explicit OCR core paths. Browser testing caught and fixed the removed relaxed-SIMD core request. No shipped maps/BUILD.txt. Windows case-insensitive licence cleanup fixed.

## Limits and unmet acceptance targets

- ZeroDrift ≤25% review and bento ≤40% review targets are not met. Scores are reported honestly. No human-labelled “looks right” data was available; reject thresholds were not relaxed or claimed calibrated.
- Overall median error does not improve on every sample. Controlled dark-page comparison with identical OCR preserved all 12 individually comparable old text scores; two source lines merged and two difficult labels were added. More editable coverage changes the aggregate distribution.
- Runtime depends on fallback search. A controlled dark run measured roughly 88–90 seconds before versus 106 seconds after, excluding OCR, with 14 versus 15 layers (16 source lines). The equal-or-faster target is not met on that run; CPU contention/one-run variance applies.
- Font metrics are shipped; shortlist currently uses rendered cap/x-height shape, width and stroke mass, not an explicit catalog-metric ratio classifier. Tabular-numeral detection, automatic mixed-style extraction and human threshold calibration remain open.
- Conservative opening protects connected thin artwork. Large supported containers are kept instead of blindly rejecting every >60% shape. Pale-pass results are reused/skipped only when quantization would be identical.
- Some complex imagery, icons and uncertain OCR remain raster. Latin/punctuation/digits are bundled; optional Hindi OCR was deferred.
- Figma editor opens in the in-app browser, but supported evaluate is read-only DOM. Arbitrary window.figma execution/raw CDP is not exposed by the permitted API. window.figma availability is unknown. User prohibited Scripter and cloud connectors; neither was used to bypass this. Native font availability, editability in an actual new frame and save/reopen persistence remain unverified.

## Size

Font binary files: 2,156,517 baseline directory bytes → 10,338,340 subset-font bytes (different inclusion noted; detailed catalog/licences included separately). Extension: 50.40 MB → 27.55 MB (-22.85 MB). Growth is within +15 MB.

## Backup and rollback

Backup: C:\Users\kartik\Documents\Codex\Pixelframe-Bundle_BACKUP_20261014-164009

180 original files, 103,972,667 bytes; all original SHA-256 hashes rechecked unchanged. ROLLBACK.md remains present. Do not overwrite/delete the backup.

Close studio/plugin; run in PowerShell only if restoring:

```powershell
$backup = 'C:\Users\kartik\Documents\Codex\Pixelframe-Bundle_BACKUP_20261014-164009'
$target = 'C:\Users\kartik\Documents\Codex\Pixelframe-Bundle'
if ((Resolve-Path -LiteralPath $target).Path -ne $target) { throw 'Unexpected restore target' }
robocopy $backup $target /MIR /XD node_modules .git BASELINE /XF ROLLBACK.md /R:1 /W:1
if ($LASTEXITCODE -ge 8) { throw 'Restore failed' }
```

Changed original paths are recorded in test-results/changed-files.json. New files include font-prefilter.ts, png-text.ts, repair regression tests, font packaging/measurement tools and this report. Run npm ci --ignore-scripts --no-audit --no-fund --cache .npm-cache, npm run typecheck, npm run build, npm run test:offline. Some real-image audits use the supplied images in Downloads and the configured Skia runtime. npm test still targets the historical independent Playwright harness and was not used under the user's in-app-only browser rule.
