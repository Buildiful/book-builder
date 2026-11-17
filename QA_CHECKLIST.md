# Book Builder — release validation checklist

**Version 1.1.0.** This checklist separates technical smoke tests from real KDP acceptance testing. Do not claim KDP compliance based solely on generated PDF dimensions.

## Browser checks performed on v1.1.0 (headless Chromium)

- [x] Inserted a PNG through the image picker and opened its selection controls.
- [x] Applied width, alignment, caption, automatic numbering, and new-page settings; confirmed changes in print preview.
- [x] Saved/reloaded a project and confirmed figure metadata and captions persisted.
- [x] Opened a simulated v1.0.0 project without figure metadata.
- [x] Imported an image-bearing DOCX and confirmed it appeared as an editable figure.
- [x] Tested a low-resolution raster image: interior preflight flagged a 39 PPI example.
- [x] Tested custom 1-inch image width and a tall portrait image with no overflow.
- [x] Sanitized loaded figure markup to reject event handlers and unsafe image URLs.
- [x] Exported a 6 × 9-inch, three-page test interior PDF, verified all page dimensions at 432 × 648 points, and detected no JavaScript page errors.

These tests use an isolated headless browser and a test manuscript, **not** a full real-world KDP acceptance test.

## Earlier v1.0.0 browser checks (retained)

- [x] App initialized in headless Chromium without JavaScript page errors.
- [x] Imported a DOCX containing headings, body text and a raster image.
- [x] Reflowed the manuscript as a 6 × 9-inch interior; opened PDF page dimensions 432 × 648 pt.
- [x] Generated the matching one-page full-wrap PDF; tested page dimensions approximately 12.2545 × 9.25 inches for a two-page test (spine is very narrow). **This short example is not itself KDP-publishable.**
- [x] Verified with `pdffonts` that test PDFs had embedded, subset fonts.
- [x] Reflowed a 21-page document to 29 pages when changing trim to 5 × 8 inches, with no overflow flags.
- [x] In a separate 119-page test, matched complete text before and after pagination.
- [x] Exported a 1600 × 2560 PNG eBook cover.
- [x] Exported and reloaded a project JSON file with cover artwork intact.

## Additional manual validation recommended

- [ ] Import your real manuscript and compare chapter headings, paragraphs, images, captions and positions to the original DOCX.
- [ ] Proofread at least the first, middle, and final page of a complete 24+ page interior.
- [ ] Inspect chapter boundaries for blank pages, isolated headings, widows and orphans.
- [ ] Export through the actual Chrome/Edge print dialog on macOS, with 100% scale, margins None, no headers/footers.
- [ ] Verify actual PDF page sizes, single-page interior, full-wrap cover, and embedded fonts (Acrobat or `pdfinfo`/`pdffonts`).
- [ ] Verify print artwork resolution and UI legibility at actual print size using the real book; replace anything below 300 PPI.
- [ ] Upload interior and cover to the **KDP Print Previewer** with the selected trim, paper and ink settings; fix every reported issue.
- [ ] Test cover spine and safe area at actual final page count, including barcode placement.
- [ ] Test a physical proof copy before promising authors professional print output.
- [ ] Confirm mobile controls and browser support (Chrome, Edge, Safari, Firefox). DOCX depends on `DecompressionStream('deflate-raw')`.
- [ ] Confirm no cross-site requests are made while importing manuscript, saving project or exporting.
- [x] Confirm MIT license and Buildiful® attribution. Review any privacy notices and disclaimers as deployment requirements evolve.
- [ ] Consider usability studies with a first-time author, including whether the workflow is actually achievable in 30 minutes.

## Unsupported or future features

- Independent layout treatment for title page, dedication, table of contents, and copyright page.
- Fully designed tables and footnotes; anchored floats; complex Word styles.
- Full-bleed interior pages and high-end illustrated layouts.
- Direct `Download PDF` without browser print dialog.
- Built-in printer ICC/color management, PDF/X, and true prepress certification.
- Automatic detailed widow/orphan prevention and facing-page chapter starts.

## Official specifications to review

- https://kdp.amazon.com/en_US/help/topic/G201857950
- https://kdp.amazon.com/en_US/help/topic/G201953020
- https://kdp.amazon.com/en_US/help/topic/G5HDYGP4BXLX4RUW
