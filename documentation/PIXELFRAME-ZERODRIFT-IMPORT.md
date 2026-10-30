# ZeroDrift image reconstruction

Prepared from `C:\Users\kartik\Downloads\41b467a316c0ffa57d44ca9be501352f (1).jpg` on 2026-10-05.

## Import

1. Open your desired current Figma page.
2. Close and rerun the existing **Pixelframe — Editable Image Import** development plugin.
3. Select `C:\Users\kartik\Documents\Codex\2026-09-15\files-pasted-by-the-user-you\outputs\pixelframe-zerodrift-editable.json` and click **Import frames**.

One 1600 x 1200 frame contains both visible source sections: Platform / The Engine and Compose. It includes 48 text layers, 28 native shapes, 3 SVG icon traces and 4 transparent raster regions. The same installed plugin is used; this request did not modify the production reconstruction engine or Siteframe.

## What is checked

- Package validation, source dimensions and absence of duplicate/hidden text.
- Existing installed importer creates all 83 layers and appends on the current page, preserving previous artwork, in a Plugin API contract test.
- All four embedded images decode locally and match their declared dimensions.
- Source versus local preview pixel comparisons cover both sections, flow diagram and policy studio. Local whole-image RGB mean absolute difference is 2.90 on a 0-255 channel scale. This includes preserved raster artwork and is not an accuracy percentage.
- Enlarged-crop OCR review recovered small labels. Shape boundaries were measured from this source; this is a reviewed artifact, not evidence that these corrections happen automatically for other images.

## Limits

**Live Figma import, actual Figma fonts and save/reopen persistence are not verified.** The connector returned `USER_NOT_LOGGED_IN` in this session. The earlier missing-artwork-after-reopen issue is not established as fixed.

Gradients, logos, connector artwork and some fine detail remain raster. Fonts are estimated; small punctuation in the Detects line and the regulatory reference needs review against the original. The package has no original-screenshot overlay or hidden replacement text. The large decorative image has 85.7% transparent pixels; it is not a flattened original design.

Files:
- `pixelframe-zerodrift-editable.json` — import-ready package.
- `pixelframe-zerodrift-preview.png` — offline preview, not a native Figma export.
- `pixelframe-zerodrift-comparison.png` — source and offline result side by side.
- `pixelframe/test-results/user-41b467/` — OCR, review, contract and pixel evidence.
