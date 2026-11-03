# Coast & Country Homes — Website

Website for [cypruscoastandcountry.com](https://www.cypruscoastandcountry.com), built with modern **plain HTML5, CSS3, and vanilla JavaScript (ES modules)**.

The discovery audit lives in [`docs/cyprus-coast-country-e2e-audit.md`](docs/cyprus-coast-country-e2e-audit.md).

## Stack

| Concern    | Choice                                                                             |
| ---------- | ---------------------------------------------------------------------------------- |
| Technology | Plain HTML5, pure CSS3, Vanilla JavaScript (ES2022+ modules)                       |
| Styling    | Pure CSS with custom properties (`base.css`, `layout.css`, `home.css`)             |
| Images     | Responsive `<picture>` elements with AVIF + WebP sources                           |
| Fonts      | Preloaded self-hosted Italiana (display) & Inter Tight (text)                      |
| Motion     | CSS scroll-driven stack, intersection observers, smooth scroll, and reveal effects |
| Data       | Direct browser integration with public CORS-enabled API with in-memory caching     |

## Project Structure

```text
index.html                    # Homepage document shell: meta tags, structured data, sections
404.html                      # Standalone not-found page
favicon.svg                   # Vector site favicon
assets/
├── css/
│   ├── base.css              # Typography, custom properties, tokens, pills, animations
│   ├── layout.css            # Header, fullscreen dialog menu, scroll-stack, footer, 404
│   └── home.css              # All homepage section layouts, carousel & card styles
├── js/
│   ├── main.js               # Main script entry point
│   ├── components/
│   │   ├── site-header.js    # Header backdrop blur and hide-on-scroll logic
│   │   ├── site-menu.js      # Fullscreen accessible <dialog> menu with featured home
│   │   ├── stack-sections.js # Pinned slide-over card stack controller
│   │   ├── scroll-reveal.js  # Viewport entrance triggers
│   │   └── count-up.js       # Animated numerical counters
│   ├── home/
│   │   ├── hero-intro.js     # Hero curtain-lift and intro loading orchestrator
│   │   ├── figures-section.js# Live figures API integration
│   │   └── featured-carousel.js # Interactive carousel conveyor with drag/swipe and autoplay
│   ├── properties/
│   │   ├── property-api.js   # API client with in-memory request caching
│   │   ├── map-property.js   # Data mapping and sanitization
│   │   ├── format-property.js# Price and area formatting utilities
│   │   └── types.js          # JSDoc type definitions
│   ├── config/
│   │   └── site-config.js    # API base URL and endpoints
│   └── lib/
│       ├── dom.js            # Element creation and motion utilities
│       └── text.js           # Headline splitting and text shortening helpers
├── fonts/
│   ├── italiana.woff2        # Self-hosted display typeface
│   ├── inter-tight-variable.woff2 # Self-hosted body variable typeface
│   └── license.txt           # SIL Open Font License
└── images/
    ├── home/                 # Optimized responsive AVIF & WebP imagery
    └── original/             # Original photography assets
```

## Running Locally

Because this is a pure HTML/CSS/JS site, you can run the zero-dependency built-in server:

```bash
npm run dev
# or: npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Alternatively, you can use any static server:
```bash
# Python
python3 -m http.server 3000

# or npx serve
npx serve .
```
