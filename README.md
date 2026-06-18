# Vector Converter

A 100% free, privacy-first image-to-vector converter that runs entirely in your browser. Converts raster images to clean, editable SVG using the open-source ImageTracerJS engine — no uploads, no caching, no paid APIs.

Why this project
- Runs completely locally in the user's browser — all processing happens on the device (computer or phone).
- No uploads or remote processing: your images never leave your device.
- No caching, no telemetry, and no paid APIs — fully free and open source.
- Built as a free-time project by college student Sreerag Harikrishnan (19).

Features
- Drag & drop or choose PNG/JPG/GIF images and convert them to SVG directly in the browser.
- Adjustable trace options (detail, despeckle, stroke/fill choices).
- Export the traced result as an SVG file.
- Works offline once the app is loaded (static hosting or local file).

How it works (technical summary)
- Image tracing uses ImageTracerJS (open-source JS tracing engine). The library analyzes pixel data in the browser and produces vector paths.
- All tracing is done client-side on the device’s CPU — there are no remote servers involved in conversion.

Quickstart (open locally)
1. Clone the repository:
   git clone https://github.com/sreerag-byte/100-FREE-VECTOR-CONVERTER.git
2. Serve the folder or open index.html in a modern browser:
   - Recommended: python -m http.server 8000
   - Visit: http://localhost:8000
3. Use the demo UI to select an image, adjust options, trace, and export SVG.

Privacy & security
- Images processed by the app never leave your device — no uploads, no remote processing.
- No paid/closed-source APIs are used for conversion.
- No caching or telemetry by default. If you self-host, HTTPS is recommended for optional network features.

Contributing
- Contributions welcome: bug reports, feature requests, UI improvements, export formats, and documentation.
- Workflow:
  1. Open an issue for large changes.
  2. Fork, create a feature
