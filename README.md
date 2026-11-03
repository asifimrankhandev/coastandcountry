# Coast & Country Homes — Website

Website for [cypruscoastandcountry.com](https://www.cypruscoastandcountry.com), built with modern **plain HTML5, CSS3, and vanilla JavaScript (ES modules)**.

The discovery audit lives in [`docs/cyprus-coast-country-e2e-audit.md`](docs/cyprus-coast-country-e2e-audit.md).

## Stack

| Concern    | Choice                                                                         |
| ---------- | ------------------------------------------------------------------------------ |
| Technology | Plain HTML, CSS and JavaScript (native ES modules; no framework, no build)     |
| Styling    | CSS custom properties across `base.css`, `layout.css` and `home.css`           |
| Images     | Responsive `<picture>` elements with pre-built AVIF + WebP, each under 200 KB  |
| Fonts      | Self-hosted, preloaded Italiana (display) and Inter Tight (text)               |
| Motion     | Compositor-only transitions (`transform`, `opacity`) and scroll reveals        |
| Data       | Public CORS-enabled property API, validated and cached per page view           |
| Types      | JSDoc types, checked with TypeScript in strict mode (see below)                |

## Project structure

```text
index.html                     # Homepage: meta tags, structured data, sections
404.html                       # Not-found page (shared header, menu and footer)
robots.txt, sitemap.xml
assets/                        # Everything here is published
├── css/
│   ├── base.css               # Tokens, element defaults, pills, reveals, keyframes
│   ├── layout.css             # Header, menu, section cards, footer, 404
│   └── home.css               # Homepage sections, including the featured carousel
├── js/
│   ├── main.js                # Entry for every page: header, menu, scroll reveals
│   ├── home.js                # Homepage entry: intro, figures, featured carousel
│   ├── components/            # Shared behaviour (header, menu, reveals, counters)
│   ├── home/                  # Homepage sections
│   ├── properties/            # API client, mapping, formatting, JSDoc types
│   ├── config/site-config.js  # API base URL
│   └── lib/                   # DOM and text helpers
├── fonts/                     # Woff2 files and their SIL Open Font License
├── icons/                     # Favicon and Apple touch icon (from the logo mark)
└── images/
    ├── brand/                 # Logo
    └── home/                  # Responsive AVIF and WebP photography
source-images/                 # Full-size masters; not published
docs/                          # Discovery audit; not published
server.js                      # Zero-dependency local server
```

## Running locally

```bash
npm run dev
```

Open http://localhost:3000. Scripts are native ES modules, so pages must be served over HTTP
rather than opened as files.

## Checks

There is no build step. Before a release, check syntax and types:

```bash
for f in assets/js/*.js assets/js/**/*.js; do node --check "$f"; done
npx -p typescript tsc --noEmit --allowJs --checkJs --strict --target es2022 \
  --module esnext --moduleResolution bundler --lib es2023,dom,dom.iterable \
  assets/js/main.js assets/js/home.js
```

## Property data

Listings come from the existing site's public API. When it fails or is slow (requests time out
after 8 seconds), the page says so and links to all properties. It never shows placeholder
homes or figures.

## Deployment

`.github/workflows/static.yml` publishes to GitHub Pages on every push to `main`. It copies only
`index.html`, `404.html`, `robots.txt`, `sitemap.xml` and `assets/` into the published site.
