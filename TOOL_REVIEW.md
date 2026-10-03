# Tool review

Reviewed on 2026-10-03. All 31 registered tools have passing tests for their representative workflows. This verifies the tested behavior; it does not cover every possible input or browser feature.

## Verification results

| Check | Result |
| --- | --- |
| Production build (`npm run build`) | Passed; 37 static routes generated |
| TypeScript (`npx tsc --noEmit`) | Passed |
| ESLint (`npm run lint`) | Passed with 0 errors and 28 existing warnings |
| Production browser suite, including real AI inference | 170 passed, 0 failed, 0 skipped, 0 flaky; 51.3 seconds |
| Dependency audit | 20 reported vulnerabilities: 2 critical, 14 high, 3 moderate, 1 low |

The final browser run used the production standalone server at `http://127.0.0.1:3102`, rather than the development server. The suite includes 124 page checks (31 tools × English desktop/Thai mobile × Chromium/WebKit), plus 46 functional tests in Chromium. Desktop and mobile viewport sizes are 1280×900 and 390×844. Every page check verifies successful loading, the selected language, a visible heading, no uncaught page errors, and no horizontal overflow.

Functional tests inspect actual outputs: images are decoded and sampled, PDFs are parsed, QR images are independently decoded with `jsQR`, hashes are compared with Node's crypto implementation, and WAV headers and duration are checked. Small synthetic fixtures keep the tests reproducible.

## Per-tool coverage

All rows below passed in the final production run. Functional checks run in Chromium; page and viewport checks run in both Chromium and WebKit.

| Tool | Functional behavior verified |
| --- | --- |
| File converter | PNG/JPEG/WebP exports, dimensions and transparency; multi-page PDF to image ZIP; real HEIC decoding |
| Background remover | Basic white-background removal and retained subject pixels; real AI model download/inference and transparent PNG export |
| Image cropper | Square crop, resize, rotation, flip, and exported pixel positions |
| Image compressor | Requested dimensions, smaller output, and successful image decoding |
| EXIF stripper | JPEG camera metadata detection/removal and transparent PNG preservation |
| Watermark | Exported image changes, unchanged dimensions, and empty-watermark behavior |
| Color picker | Uploaded-image pixel selection and copied HEX value |
| Color tools | Known RGB/HSL/OKLCH conversion and valid linear/radial/conic CSS gradients |
| Color palette | Five distinct colors extracted from an image and copied |
| QR generator | 512-pixel PNG export, independently decoded payload, and oversized-input handling |
| JSON formatter | Formatting, minifying, downloaded JSON, and invalid-input handling |
| CSV/JSON | Quoting, multiline fields, Thai text, value coercion, round trips, invalid inputs, and collision-safe headers |
| Base64 | Unicode and URL-safe text, invalid UTF-8, binary file round trip, and malformed-padding rejection |
| URL tools | Component/URI encoding, Thai round trip, invalid decoding, and query edits preserving duplicate keys and fragments |
| JWT decoder | Bearer prefix, Unicode payload, expiry, invalid input, and explicit signature-verification limitation |
| Hash generator | MD5, SHA-1, SHA-256, SHA-384, and SHA-512 for text/files against independent reference hashes |
| UUID generator | Bulk v4/v7 syntax and uniqueness, v7 timestamp, and downloaded IDs |
| Regex tester | Capture groups, replacements, invalid syntax, and timeout for catastrophic backtracking |
| Timestamp converter | Seconds/milliseconds, epoch zero, negative epochs, local-date conversion, and invalid input |
| Password generator | Lengths 4/16/64, selected character classes, exclusions, last-class guard, and clipboard output |
| PDF tools | Ordered merge, rendered thumbnails, selected-page split, and smaller compressed PDF preserving pages |
| Markdown editor | Safe preview, tables/formatting, MD/HTML/PDF exports, and autosave restoration |
| Thai keyboard | Kedmanee correction, automatic direction detection, and reverse conversion |
| Text case | All ten case styles and Thai preservation |
| Word counter | English/Thai counting, Unicode/emoji characters, and configured limits |
| Diff viewer | Character/word/line modes, inserted/deleted content, copied result, and input swap |
| Unit converter | CSS unit calculations in both directions and invalid-base handling |
| Audio editor | Playback/pause, selected trim region, and WAV export with expected duration |
| Lorem ipsum | Requested word/sentence/paragraph counts and clipboard output |
| Random picker | No-repeat selection, exhaustion, and reset |
| Spin wheel | Displayed winner matches the segment under the pointer; entry removal and persistence |

## Fixes included

1. **CSV column data loss:** Duplicate headers could collide with an existing suffixed header, extra columns could collide with generated names, and `__proto__` columns disappeared. Column names are now globally unique, and output records preserve all header names.
2. **Base64 file validation:** Invalid padding could show a file as ready and then fail during download. Validation now checks the unpadded body and required padding separately while preserving valid unpadded input.
3. **Spin wheel result mismatch:** Fractional extra rotations could leave the pointer on a different entry from the announced winner. Extra rotations now use whole turns.
4. **Spin wheel mobile overflow:** Fixed dimensions and rotated label wrappers widened the mobile page. The wheel now fits its container, inputs can shrink, and labels stay clipped inside the wheel.
5. **Markdown production PDF export:** The original screenshot renderer rejected Tailwind's production `lab()` colors. PDF export now lazily loads [html2canvas-pro](https://github.com/yorickshan/html2canvas-pro), whose color parser supports the generated CSS. The exported PDF is checked by parsing it.
6. **AI download estimate:** Updated both languages from about 40 MB to about 100 MB for the default model plus runtime.

Each functional/layout fix has a regression test. Existing Docker, standalone-build, and PDF thumbnail changes were preserved.

## Remaining findings and limits

`npm audit` reports 20 affected dependency entries, including critical findings for `next` and `jspdf`, and high findings for `pdfjs-dist`, `colorthief`, and development dependency `eslint-config-next`. These are dependency-level reports, not proof that every advisory is reachable in this application. Dependency upgrades and advisory applicability need a separate compatibility/security review; no forced audit upgrades were applied.

The 28 pre-existing lint warnings remain, mainly image-element guidance and state updates in effects. They do not prevent the build or current tests from passing.

Browser-native screen eyedropper interaction, physical mobile devices, all functional workflows in WebKit, very large files, and every malformed input/format combination have not been verified. The uploaded-image color picker is covered. PDF compression is checked on an unoptimized fixture; already optimized files may not shrink. AI coverage confirms the pipeline works on a synthetic image, rather than establishing segmentation quality for all photos. Its first run needs a network connection to download the model and runtime.

## Run the tests again

```bash
npx playwright install chromium webkit
npm run test:e2e
```

The default suite skips the AI download/inference test. Include it with:

```bash
RUN_NETWORK_TESTS=1 npm run test:e2e
```

To test a production server that is already running:

```bash
TEST_BASE_URL=http://127.0.0.1:3102 RUN_NETWORK_TESTS=1 npm run test:e2e
```

The default configuration starts or reuses a development server on port 3100. Production testing is recommended because the Markdown color-parser failure occurred only in the production build. JSON results are saved to `test-results/results.json`; failed tests retain screenshots and traces. Test definitions live in `tests/`, and browser/server settings live in `playwright.config.ts`.
