# Ostellos MS — Hostel Management System Landing Page

A modern, performant landing page for the Ostellos MS hostel management system.

## Project Structure

```
landing/
├── src/
│   ├── main.js          # App entry point
│   ├── navigation.js    # Mobile navigation
│   ├── scroll-reveal.js # Scroll reveal animations
│   ├── kpi-counter.js   # KPI count-up animation
│   └── styles.css       # Stylesheet
├── index.html           # Main HTML
├── logo.png             # Brand logo
├── vite.config.js       # Vite build config
├── tsconfig.json        # TypeScript config
└── package.json         # Project configuration
```

## Getting Started

```bash
npm install
npm run dev       # Development server
npm run build     # Production build
npm run preview   # Preview production build
npm run test      # Run tests
```

## Performance Optimizations

- CSS `contain` for off-screen sections
- `content-visibility: auto` for below-fold sections
- `will-change` hints for animated elements
- Modular JavaScript with ES modules
- Lazy loading for images
- Font preconnect and preload