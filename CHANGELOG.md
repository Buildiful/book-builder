# Changelog

## 1.1.0 — 2026-11-16

### Added

- Illustration settings for width (natural, full, 75%, 50%, or custom inches) and left/center/right alignment.
- Caption editing, optional automatic figure numbers, and per-illustration new-page control.
- Interior image preflight estimating effective PPI at rendered print size, with warnings below 300 PPI.
- Automatic resizing of oversized illustrations on an otherwise empty page when possible.
- Image insertion via clipboard paste and file drop in the manuscript editor.

### Improved

- Figures and captions are kept together in the preview and printed interior.
- Existing v1 project JSON files remain compatible; figure settings survive save/reopen.
- Toolbar image insertion retains the manuscript cursor position when opening the file picker.
- Untrusted pasted image URLs and HTML event attributes are not retained.
- Interior PDF export waits for manuscript raster images to finish decoding.

### Unchanged

- Static, local-first architecture; no account or backend required.
- Existing cover studio, trim-size controls, print-to-PDF workflow, privacy/analytics consent integration, favicon and Buildiful® branding.
- Project format version remains 1 for backward compatibility.

### Known limitations

- No text wrapping around images, side-by-side figure composition, or interior bleed.
- Original Word image placement, crop and captions are not automatically reconstructed.
- Quality checks are advisory, and PDF export still uses the browser print dialog.

## 1.0.0 — 2026-11-13

- First public release: manuscript import, page composition, cover studio, local project files, and print-to-PDF workflow.
