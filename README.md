# Book Builder

**A free, local-first book formatting and cover design studio.** Built for authors who want to create a simple paperback without professional publishing software. Part of the Build Anything Yourself philosophy.

> **Version 1.1.0.** Book Builder is free, open-source software licensed under MIT. It is not KDP-certified; keep backups of your manuscripts and verify every PDF in KDP Print Previewer before publication.

## What works today

- Import `.docx`, `.txt`, or `.md` manuscripts **without uploading a document to a server**.
- Edit manuscript paragraphs and headings, style inline text, and add PNG/JPEG/WebP illustrations, including clipboard images.
- Paginate into paperback pages with chapters starting on fresh pages.
- Select an illustration for fit-to-page, full/75%/50%/custom-inch width, left/center/right alignment, captions, optional automatic figure numbering, and an optional new-page start.
- Keep each illustration and caption together during pagination; automatically scale oversized figures down to fit on a fresh page when possible.
- Report the *effective* print resolution of interior images and flag images below 300 PPI.
- Set 5 × 8, 5.5 × 8.5, 6 × 9, or 8.5 × 11 in trim sizes.
- Configure typeface, body size, line spacing, margins, and mirrored gutters.
- Preview pages before export, with page numbers and optional running titles.
- Design a full-wrap cover that sizes the spine to the final interior page count.
- Reserve a blank space for KDP's barcode; generate a 1600 × 2560 eBook cover PNG.
- Save and reopen a self-contained `.bookbuilder.json` project.
- Print interior and cover separately as **vector PDFs using the browser's Save as PDF** command.
- Surface advisory checks for KDP paperback page count, gutter, cover-image resolution, and interior-image resolution.

## How to run

No packages, build tools, user accounts, backend, or dependency CDNs are required.

1. Open `index.html` in the latest Chrome or Edge, or host the directory using any static server.
2. Import your manuscript or edit the example.
3. Set book format, choose your cover, and check the live preview.
4. If your book has illustrations, click each image inside the manuscript editor to open **Illustration settings**. Set its width and alignment, add an optional caption and figure number, and review the PPI status.
5. Go to **Export & check**. Click **Save interior PDF** and choose **Save as PDF** from your browser print dialog. Confirm **scale = 100%**, **margins = None**, **headers and footers = off**; the custom page size is supplied by Book Builder.
6. Repeat with **Save cover PDF**. KDP requires one full-wrap cover (back + spine + front) and single-page interiors.
7. Open both PDFs, check the physical dimensions, and review with **KDP Print Previewer** before any publication.

For local development you can run `python3 -m http.server 8000` from this directory and visit `http://localhost:8000/`.

## GitHub Pages deployment

This is a static website. Create a public GitHub repository; upload all source files to the repository root. Under **Settings → Pages**, choose **Deploy from a branch**, `main`, `/ (root)`. No build workflow is needed. Always review your changes before publishing.

## Illustrations (new in v1.1.0)

In **Manuscript**, use the image icon in the formatting toolbar or paste a PNG/JPEG/WebP image from your clipboard. Images imported from DOCX appear as figures. Select any figure in the editor to show **Illustration settings** below the editor.

- **Width:** Fit naturally (existing behavior), 100%, 75%, 50% of the text area, or custom inches. The custom width is capped to the printable text width and aspect ratios are preserved.
- **Alignment:** left, center, or right within the text area; text does not wrap around figures.
- **Captions:** optional plain-text captions. Tick **Prefix caption with an automatic figure number** to number captioned figures in manuscript order in the preview and printed PDF. Keep figure numbers out of the typed caption field to avoid doubling them.
- **Page placement:** figures and captions are kept as one block. Tick **Start this illustration on a new page** to force a page break; otherwise figures move together to the next page when necessary. If a figure is too tall on an otherwise empty page, the preview tries reducing its displayed size; an overflow warning remains if it cannot fit (for example, an excessively long caption).
- **Resolution:** effective PPI is estimated from the raster pixel dimensions and the actual displayed size in the print layout. This is a quality warning, not image enhancement. Replace low-resolution screenshots rather than upscaling them.

**Saving projects:** figure settings are stored within the existing self-contained `.bookbuilder.json` file. Project format remains `version: 1`, so files from Book Builder v1.0.0 can be opened in v1.1.0 without conversion. Save a separate backup before editing important manuscripts. v1.0.0 does not understand the newly added figure settings, so do not rely on opening a v1.1.0 project in an older copy of the app.

**Still unsupported:** automatic Word caption detection, original Word image anchoring/cropping, side-by-side figures, floating text wrap, and full-page bleed. A user should verify all imported images and captions after importing a DOCX.

## Supported manuscript content

DOCX: paragraph text, basic headings, bold/italic runs and inline images are imported. Original Word image sizes, anchoring, and captions are not replicated; adjust these manually. Tables are flattened to plain-text rows. Text inside shapes, footnotes, multi-column layouts, anchored object positioning, and complex Word styles are *not* reproduced. DOCX import relies on the standard `DecompressionStream('deflate-raw')` browser interface.

The editor is deliberately simple. It is not a full Microsoft Word replacement. Do not discard your original manuscript.

## Known limitations and important cautions

- **PDF export uses the browser print dialog.** It does not programmatically download PDF files. Chrome or Edge is recommended; other browsers may implement custom `@page size` handling differently.
- **No interior bleed.** This version deliberately uses no-bleed, text-focused interior pages. Do not use it for edge-to-edge print layouts.
- **Not guaranteed KDP acceptance.** Test print font embedding, page dimensions, image rendering, and barcode safety in exported PDFs and the official KDP preview. The preflight list is advisory, not exhaustive.
- **No embedded ISBN or barcode.** Leave a blank rectangle for KDP's barcode. Enter your KDP or owned ISBN in the publishing form.
- **Book page minimum** is usually 24 but print options have other restrictions. Check official KDP rules for your print options.
- **Typeface availability depends on the author's device.** PDFs generated by Chrome typically embed the fonts it used, but check the exported file rather than assuming this is guaranteed.
- **Raster images in PDF output** are included at their uploaded resolution; scaling up does not add detail. Verify readability at the final physical print size.
- **RGB cover output** may produce color variance in print. The image upload resolution check is approximate; it is not a complete color/separation preflight.
- **PDF content is editable in most PDF editors.** Always proofread printed copies.
- **Manuscripts remain local.** Book Builder does not send your content anywhere. Closing the page does not save your work automatically: choose **Save project** before closing.
- **Cover text has length limits.** Very long titles and blurbs need manual inspection in preview.
- **eBook cover PNG uses the paperback design adapted to an eBook aspect ratio.** Kindle Create is still needed to prepare the eBook manuscript and KPF file.
- **Spine text is intentionally omitted** on short or narrow books (in addition to the minimum 80-page KDP rule).

## Official KDP references

- [Paperback Submission Guidelines](https://kdp.amazon.com/en_US/help/topic/G201857950)
- [Paperback Cover Guidelines](https://kdp.amazon.com/en_US/help/topic/G201953020)
- [KDP Barcodes](https://kdp.amazon.com/en_US/help/topic/G5HDYGP4BXLX4RUW)

## License

MIT. Copyright © 2026 Buildiful®. See `LICENSE`. A hands-on validation checklist is in `QA_CHECKLIST.md`. Book Builder is not affiliated with Amazon or Kindle Direct Publishing.
