# Pixelframe — image to editable Figma

Local development build **0.1.6**, 8 October 2026. This revision changes the existing Pixelframe extension and Figma importer. See `INTEGRATION-20261008.md` for current evidence and limitations; older evidence below is historical.

Long screenshots now process sequential sections into one frame; oversized sources fit the existing 20 MP / 12,000 px import limits. OCR preserves complete lines over fragments and revisits up to eight weak regions per section. Font fitting uses observed ink bounds, smooth backgrounds can be recovered conservatively, empty image crops are removed, and missing Figma fonts are retried using compatible family fallbacks. Pale outline recovery supplements existing geometry while excluding small decorative grid cells.

This is not parity with manually reviewed examples. Fonts, OCR, fine borders, icons and obscured content can differ or remain raster. Native Figma and Chrome UI validation for this revision is blocked by `Browser is not available: iab`; passing local engine/importer tests does not establish native visual fidelity. Use `npm run build`, `npm run typecheck`, and `npm run test:offline` for the browser-free regression suite.

## Update and use

Reload Pixelframe in `chrome://extensions` and reopen its studio tab. The existing installation folder is `outputs/pixelframe-chrome-extension`. In Figma desktop, rerun **Pixelframe — Editable Image Import**, using `outputs/pixelframe-figma-plugin/manifest.json` if it has not been registered yet.

Choose PNG/JPG/WebP → Reconstruct images → review the visible text and source comparison → Export package → import in Pixelframe on the desired Figma page. Independent source-sized frames appear horizontally to the right of existing content. The image studio does not scan websites and has no website permissions.

## Background fragmentation repair � 0.1.4

The 2786�2786 supplied Crucible screenshot exposed false panels in a blue photographic background. Quantized colour components had straight boundaries caused by compression/colour grouping; the detector incorrectly treated them as rectangles. Geometry alone is now insufficient: localized edge evidence on multiple sides is required. Large panels recover stable side boundaries when a few similar background pixels connect to them. Thin fragments and shapes fully inside known text boxes are rejected. Occluded-panel joining now requires actual partial panels and a foreground object aligned with the gap, so sibling cards cannot merge through their enclosing parent.

Fresh conversion of the exact source produced **24 text / 7 shapes / 6 images**, compared with **24 / 21 / 8** in the user's package. All 14 blue false panels are gone; the large white container is now a native shape. The exported package was rendered again with its first background artwork layer hidden. Pixel assertions found no coloured fragments across the tested top-right and outer side margins, and zero overlapping nontransparent raster pixels. Synthetic tests reject quantized gradient bands and retain clipped white panels without merging sibling cards. The previous modal detection still produces its 9 shapes and 1 trace.

This repair improves layer structure. Whole-image mean absolute RGB error is 1.013 versus 0.930 for the previous package (0�255, including raster artwork), so it does not establish improved pixel fidelity. The photographic background, shield graphic, gradient button and decorative borders remain raster. Typography was not redesigned. Native Figma rendering has not been repeated; importer contract tests verify the new package's text count, shape coordinates and dimensions. Evidence is in `test-results/gradient-v014/`; ready artifacts are `pixelframe-gradient-editable.json`, `pixelframe-gradient-comparison.png` and `pixelframe-gradient-audit.json`.

Reload the existing Pixelframe extension, reopen the studio and reconstruct the source again, or import the ready JSON. Existing exported/imported designs do not update automatically.

## Image-region and stability repair � 0.1.3

The supplied chat/modal screenshot exposed three independent causes: exact-colour component detection missed interrupted/asymmetric panels; raster crops copied overlapping bounding rectangles instead of their owned pixels; and a hidden background-panel contour could restore pixels from foreground text. Quantized typed-array components now detect separate corner radii, native strokes and conservatively joined occluded panels. Raster crops own disjoint pixels. Only visible contours are repaired, using the text-cleaned image, and native backgrounds replace unnecessary contour patches.

The fresh modal package has **9 visible editable texts, 9 native shapes, 1 vector trace and 11 raster regions**. The old package had 9 text candidates (including a bogus icon reading), 2 shapes and 1 large raster containing the modal body and chat. The repair makes the modal body, bubbles, buttons and chat container independently editable. It adds the previously missed �Describe me based on our chats� text and removes the bogus text. A larger region count than this old single flattened crop is expected: native surfaces are now separated from artwork. This count is not the same case as the user's 106-region screenshot.

Final in-app Chromium tests: marketing fixture **20 text / 6 shapes / 6 images**; dashboard **12 text / 5 shapes / 3 images**. Both complete in one batch after cancellation. The exact source for the screenshot showing 106 regions was not available for a repeat run.

Pixel assertions on the fresh exported modal package show **zero overlapping nontransparent raster pixels**, no restored text along the occluded chat-panel edge, plain white background after removing the two native buttons and their labels, and grey backdrop after removing the native modal body. The browser whole-image mean absolute RGB error is **0.679 on a 0�255 scale**, including preserved raster artwork. This is not a font-accuracy or editability percentage. Evidence: `test-results/modal-v013-release/` and the exported `pixelframe-modal-*` artifacts.

OCR expansion is capped at 4 MP, component queues use typed arrays, and intermediate canvases are released. Preview encoding is serialized and stale edits coalesced; 26 stress-test encodes had a peak concurrency of one. Only one preview Blob URL remained, dropping to zero on selecting a new image. Testing reproduced a cancellation hang caused by Tesseract's pending request surviving worker termination; an explicit cancellation promise and isolated run ownership now permit immediate retry, including cancellation during worker initialization. The user's Chrome process crash was not reproduced, so these changes do not guarantee crash-free operation.

**Remaining:** photo artwork, some low-contrast background labels/icons and shadows remain raster. Occluded background pixels are inferred; moving panels cannot recover the original hidden content. Fonts and geometry remain estimates. This revision passed importer contract checks for corner radii, strokes, current-page placement, visible text and rollback, but native Figma rendering was not reverified because Figma in the in-app browser was signed out. The native Nexo evidence below is historical **0.1.2** evidence, not native proof of this repair.

## Previous typography repair � 0.1.2

- Reconstructed text is always visible editable TEXT. New packages contain no text-image substitutes. The importer does not add hidden text copies or whole-screenshot reference layers, even for legacy packages.
- OCR retains word boxes, separates icons/list markers, deduplicates overlapping detections, and revisits omitted list-number regions.
- Font matching compares original-resolution RGB glyphs, refines family-diverse candidates, fractional size, tracking and origin, and evaluates natural spacing against observed word positions. Adjacent aligned text lines can share a font when their combined pixel evidence supports it.
- Ambiguous OCR such as AI/Al or I/| is compared against image pixels; uncertain alternatives are shown in the studio. No blanket keyword replacement is used.
- Exact RGB sampling distinguishes near-white page backgrounds from white panels. Large flat panels with internal content can now become native shapes.
- Figma measures disposable text outlines to place retained TEXT nodes at their observed ink positions. Space adjustments preserve each logical line as one TEXT layer. Measurement copies are removed immediately.
- The importer reports loaded fonts, substitutions and actual text geometry, and can export a native Figma PNG for comparison.

Four open font families (DM Sans, Inter Tight, Open Sans and Roboto; 14 faces) are bundled with OFL licenses for offline matching. Other candidates use installed fonts. Figma also needs the selected fonts; the import report explicitly lists substitutions. A Figma restart may be needed after installing fonts.

## Verified evidence and remaining limitations

The supplied 1280×1345 Nexo image was processed with fresh local OCR and compared with v0.1.1. It produces 37 visible editable text nodes, including all three list markers; eight shape layers and five monochrome vector traces. Artwork, shadows, fine borders and some icons remain 14 transparent raster regions. This is not a fully vectorized design.

Native Figma import and PNG export were tested, exposing and fixing page-offset positioning and space-width bugs that a mock did not catch. A retained TEXT node was changed to `EDIT CHECK`, exported, and restored; the changed export has different visible pixels. All 37 text nodes are visible, with zero hidden children. Frame `2217:1976` is on current page `0:1`. The audit report records substitutions and actual geometry. Browser and Figma font versions/antialiasing still differ. Heading and body typography are approximations; some OCR words remain ambiguous. Do not interpret OCR confidence, whole-image similarity, or native layer counts as proof of exact fonts or full editability.

The final repeat (`test-results/nexo-v012-blocks`) also passes word-spacing evidence into block-level font fitting. Its aligned list body uses a common family/weight instead of switching between five font faces. Matching took 168 seconds using cached OCR. Whole-image mean absolute RGB error (0–255) was 2.242 for the previous browser editable candidate, 1.191 for the new browser preview, and 2.477 for the actual Figma export. These are different renderers; the figures do **not** prove a native visual improvement over a previous native Figma export. The comparison includes preserved raster artwork. Native font substitutions and antialiasing remain unresolved fidelity limitations.

Unsupported/low-confidence text over complex imagery may remain raster and is reported. The imported frame uses absolute positioning; screenshot pixels do not provide reliable original Auto Layout or component semantics. No production selectors, text strings, or layout coordinates are specific to Nexo.

## Validation and development

`npm run build`, `npm run typecheck`, `npm test`, `npx tsx tests/typography.ts`, `npx tsx tests/real-image.ts`, `npx tsx tests/contract.ts`, `npx tsx tests/ocr-cancel.ts`, `python tests/audit-modal.py`.

The ten controlled typography fixtures test known text independently of OCR. Mean normalized text error is about 0.0124 versus 0.456 in the earlier matcher; all ten sampled flat colours match exactly in Chromium. This is a controlled fixture result, not a general accuracy percentage. Actual extension tests cover offline OCR, multi-image export, corrections, font/colour controls, cancellation and input validation. The sandbox importer tests cover current-page positioning, visible text, no substitutes and rollback.

`tests/nexo.ts <label> --fresh` runs the supplied image through real OCR; without `--fresh` it reuses saved OCR for typography iteration. `tests/coverage.ts <label>` checks text/shape coverage. `tests/native-figma.mjs` is a development-only native harness, not part of the installed product. It temporarily replaces the development bundle with an embedded test package and a localhost evidence collector; always restore with `npm run build` afterward.

Limits: eight images, 25 MB per file, 20 megapixels, 12,000 px per side, 80 MB JSON package. English OCR is bundled. Analysis is limited to four megapixels. PDFs and scanned document workflows are not included. Conversion on the Nexo fixture takes several minutes on this machine; progress and cancellation are available between lines. No screenshot is sent to an AI service.


## 0.1.5 - additional difficult designs and font fitting

The current extension folder and Figma development plugin have been rebuilt. Reload Pixelframe at chrome://extensions, close its studio tab and reopen it. Close and rerun the Figma plugin. Reconvert the source image: old JSON and old imported frames do not update automatically.

Four previously untested local designs were run through Tesseract and the reconstruction engine: collaboration dashboard, luxury product page, dark agency layout and agency bento page. Import pixelframe-hard-images-editable.json for all four frames on the current page. The package contains 116 visible text layers, 22 shapes and 117 raster regions across the four frames.

The detector now excludes letters recognized by OCR even if their font or background leaves them raster. This prevents letter stems and counters from becoming arbitrary panels. The dark sample drops from 4 to 2 shapes and the bento sample from 6 to 5. Size, tracking and baseline are refined together; four known-font fixtures do not regress. Font weight/italic edits release stale local-face aliases, and the importer reports an unresolved italic substitution even on a variable font.

Build, typecheck, OCR cancellation, importer contract and region regressions pass. The four new outputs were rendered with an offline Skia test adapter; this session did not have browser control or a connected native Figma app, so native Figma import/render and Chrome UI behavior remain unverified. Some headings and artwork remain raster; exact fonts are not guaranteed. One sample's whole-image RGB error increases slightly while gaining an editable text layer; three improve. Metrics include artwork and are not an accuracy percentage.

Evidence: pixelframe-hard-images-comparison.png, pixelframe-false-shape-comparison.png and pixelframe-hard-images-audit.json. The exact original behind the latest healthcare Figma screenshot was not positively identified. Only Pixelframe was edited.

## Native Figma verification and font-family repair - 2026-10-04

This supersedes the earlier native-verification blocker. The same production importer ran against the real Figma Plugin API through Scripter in the in-app browser. Four source-sized frames were added horizontally to current Page 1: 116 visible TEXT nodes, 22 shapes, 117 raster regions, zero hidden children. A text edit on a disposable copy changed each frame's exported pixels; restoring the original produced identical PNG bytes for all four frames. The 86 original top-level nodes were preserved; four temporary baseline frames were removed, leaving 90 nodes on the page.

Native testing exposed SF Pro Display/Text falling back to Inter even though Figma offered the related SF Pro variable family. The resolver now prefers that related family, preserves weight and slant, and excludes compressed styles. Explicit families still take priority; aliases remain reported as substitutions because versions and optical sizes can differ. Inter optical-size family names are recognized as related; Inter Tight is not treated as an exact match. After rebuilding the same installed folders, a second native import confirmed 34 text nodes using SF Pro. All four source-to-native pixel comparisons improved; the luxury sample's text-box mean RGB difference fell from 27.13 to 19.25 on a 0-255 scale. These metrics are not accuracy percentages.

Final frames: [Collaboration](https://www.figma.com/design/PO2H3C7y6U3N68JF7cc41o/?node-id=2411-1343), [Luxury](https://www.figma.com/design/PO2H3C7y6U3N68JF7cc41o/?node-id=2411-1487), [Dark agency](https://www.figma.com/design/PO2H3C7y6U3N68JF7cc41o/?node-id=2411-1635), [Bento](https://www.figma.com/design/PO2H3C7y6U3N68JF7cc41o/?node-id=2411-1731).

Evidence: `../pixelframe-hard-images-native-audit.json`, `../pixelframe-hard-images-native-comparison.png`, and original native PNG exports under `test-results/native-hard-v015/figma-0.png` through `figma-3.png`. Build, typecheck, importer contract, font/shape regression and a separate synthetic headless Chromium extension smoke test passed. Real user-profile Chrome crash behavior remains unverified. There are still 37 font/style mapping warnings, OCR mistakes and raster artwork; the result is not fully editable or a perfect font match.

Reload the existing Pixelframe extension and reopen its studio. Close and rerun the existing Figma development plugin. Reimport an existing package to apply this importer font fix; frames already on the canvas do not update automatically. Siteframe was not edited.
