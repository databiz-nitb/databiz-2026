# DataBiz icons

Drop this folder into your repo's public/static directory as `icons/` (so `favicon.ico` ends up at `/icons/favicon.ico`).
Brand orange `#FF6B45`, dark `#0C0E13`, light `#F6F5F2`.

## Add to `<head>`
```html
<link rel="icon" href="/icons/favicon.ico" sizes="48x48">
<link rel="icon" href="/icons/svg/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icons/png/apple-touch-icon.png">
<link rel="manifest" href="/icons/site.webmanifest">
<meta name="theme-color" content="#0C0E13">
```
(If you'd rather serve favicons from the site root, copy `favicon.ico` there and adjust paths.)

## Contents
- `svg/databiz-logo.svg` – orange mark, transparent (use in the navbar/hero)
- `svg/databiz-logo-dark.svg`, `-white.svg` – single-color variants
- `svg/favicon.svg` – tight-cropped mark for browser tabs
- `svg/databiz-icon-dark.svg`, `-light.svg` – rounded-square app icons
- `png/databiz-logo-{16..1024}.png` – transparent PNG logo sizes
- `png/favicon-*.png`, `favicon.ico` – 16/32/48
- `png/apple-touch-icon.png` (180), `android-chrome-192/512`, `maskable-icon-512x512.png`
- `site.webmanifest` – PWA manifest (update paths if you move the folder)

Note: the mark was redrawn as vector from the website screenshot, so it's very close but not pixel-identical to your original source file. If you have the original SVG, swap it in for `svg/databiz-logo.svg`.
