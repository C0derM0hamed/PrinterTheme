# PrinterTheme

A premium **Salla Twilight** theme engineered specifically for print shops. Built on the
EShopper reference structure, elevated with a modern UI, and extended with a full
**print-shop toolkit** — paper size, paper type, sides, color mode, finishing options,
a live quote calculator, and a drag-and-drop design-file upload zone.

---

## Highlights

- **Salla-native:** ships `twilight.json`, the canonical Twilight directory layout, and
  uses `{{ salla.head() }}` / `{{ salla.footer() }}` plus the full `salla.cart.*` /
  `salla.event` SDK.
- **Hybrid stack:** Bootstrap 4 + jQuery + Font Awesome via CDN — no Webpack, no
  Tailwind, no compile step; works out of the box.
- **Bilingual & RTL-first:** Arabic + English locale files hand-keyed to every `| t`
  string; RTL-safe CSS via `[dir="rtl"]` selectors throughout.
- **Print toolkit:** segmented controls for paper size, paper type, sides, color mode
  and finishing; live unit price + subtotal + delivery ETA recalculated on every
  change, all client-side.
- **Merchant-customisable:** colors, font, grid density, upload limits, delivery base
  days and WhatsApp number all exposed as draggable settings in the Salla dashboard.

---

## Requirements

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 LTS |
| Salla CLI | latest (`@salla.sa/cli`) |
| A Salla Partner account | [partners.salla.sa](https://partners.salla.sa) |

---

## Getting Started

### 1. Install the Salla CLI

```bash
npm install -g @salla.sa/cli
```

### 2. Authenticate

```bash
salla login
```

Follow the browser prompt to connect your Salla Partner account.

### 3. Register the theme (first time only)

```bash
cd PrinterTheme
salla theme create
```

This registers the theme in your Partner dashboard and links the local directory.

### 4. Preview locally

```bash
salla theme preview
```

The CLI watches `src/` and live-reloads Twig, CSS, and JS in a connected demo store.
No build step is required — Bootstrap 4, jQuery, and Font Awesome are loaded via CDN.

### 5. Publish to the store

```bash
salla theme publish
```

---

## Directory Structure

```
PrinterTheme/
├── src/
│   ├── views/
│   │   ├── layouts/
│   │   │   └── master.twig              # Base layout — salla.head() / salla.footer()
│   │   ├── pages/
│   │   │   ├── index.twig               # Home page
│   │   │   ├── cart.twig                # Cart page
│   │   │   ├── thank-you.twig           # Post-checkout order confirmation
│   │   │   ├── page-single.twig         # CMS static pages
│   │   │   ├── loyalty.twig             # Loyalty / rewards page
│   │   │   ├── landing-page.twig        # Campaign landing page
│   │   │   ├── product/
│   │   │   │   ├── single.twig          # Product detail (includes print toolkit)
│   │   │   │   └── index.twig           # Product listing + search results
│   │   │   ├── customer/
│   │   │   │   ├── profile.twig
│   │   │   │   ├── wishlist.twig
│   │   │   │   ├── notifications.twig
│   │   │   │   └── orders/{index,single}.twig
│   │   │   ├── blog/{index,single}.twig
│   │   │   └── brands/{index,single}.twig
│   │   └── components/
│   │       ├── header/header.twig       # Site header + mobile drawer
│   │       ├── footer/footer.twig       # Footer + back-to-top FAB
│   │       ├── product/card.twig        # Product card (grid + list views)
│   │       ├── cart/item.twig           # Cart line item row
│   │       ├── product/print-specs.twig # Print-options panel (segmented controls)
│   │       ├── product/quote-calc.twig  # Live quote + delivery ETA sticky panel
│   │       ├── product/upload-zone.twig # Design-file drag-and-drop zone
│   │       └── home/                   # hero, features, categories-grid,
│   │                                   # featured-products, latest-products
│   ├── assets/
│   │   ├── styles/main.css             # All custom CSS (Bootstrap overrides + theme)
│   │   ├── js/
│   │   │   ├── theme.js                # Global: back-to-top, sticky nav, mobile
│   │   │   │                           # drawer, qty stepper, cart-count sync
│   │   │   ├── product.js              # Product page: options, print specs, quote
│   │   │   │                           # calc, upload zone, add-to-cart wiring
│   │   │   └── cart.js                 # Cart page: qty update, remove, coupon
│   │   ├── images/                     # Placeholder assets (logo.svg, hero, offers)
│   │   └── fonts/                      # Reserved for local font files (CDN used now)
│   └── locales/
│       ├── en.json                     # English strings
│       └── ar.json                     # Arabic strings (RTL, print context)
├── twilight.json                       # Salla theme manifest (settings, features)
├── package.json                        # Theme metadata + optional lint script
├── README.md
└── .gitignore
```

---

## Merchant Settings

All settings below are exposed in the **Salla merchant dashboard** via `twilight.json`
and can be changed without touching code.

| ID | Type | Default | Description |
|----|------|---------|-------------|
| `primary_color` | color | `#0d6efd` | Primary brand color applied to buttons, links, and badges (CSS `--color-primary`). |
| `accent_color` | color | `#ff6b4a` | Accent / CTA color used on highlights and hover states (`--color-accent`). |
| `font_family` | list | `Poppins` | UI typeface — choose from **Poppins**, **Cairo**, or **Tajawal**. |
| `show_hero_slider` | switch | `true` | Toggle the full-bleed hero slider on the home page. |
| `products_per_row` | list | `3` | Grid density: **2**, **3**, or **4** products per row. |
| `enable_file_upload` | switch | `true` | Show the design-file upload zone on product pages. |
| `accepted_file_types` | string | `.pdf,.ai,.psd,.png,.jpg,.jpeg,.eps` | File types accepted by the upload zone (`<input accept>`). |
| `max_upload_mb` | number | `50` | Maximum upload size in megabytes enforced client-side. |
| `min_order_quantity` | number | `1` | Minimum quantity enforced in the print-specs stepper. |
| `enable_print_specs` | switch | `true` | Show the paper / sides / finishing control panel on product pages. |
| `delivery_base_days` | number | `3` | Base business days added to today's date for the delivery ETA estimate. |
| `whatsapp_phone` | string | `""` | WhatsApp number (international format, no `+`) for the Quote CTA and support FAB. |

### Custom home-page components

Two additional sections are registered for the home-page drag-and-drop composer:

| Component | Path key | Purpose |
|-----------|----------|---------|
| **print-services-grid** | `home.print-services` | Promote print categories with icon + title + link tiles. |
| **quote-cta-band** | `home.quote-cta` | Full-width promotional band that links to the quote / contact flow. |

---

## Print-Shop Toolkit

The toolkit lives in three Twig components included by `pages/product/single.twig`
and wired together by `src/assets/js/product.js`.

### `components/product/print-specs.twig` — Print Options Panel

A segmented-control UI that lets the customer configure their print job before adding
to cart. Every control exposes a `data-` attribute consumed by `product.js` for live
recalculation:

| Control | Options | Data attribute |
|---------|---------|----------------|
| **Paper size** | A6 / A5 / A4 / A3 / A2 / Custom | `data-multiplier` (e.g. A4 = 1.0, A3 = 2.0) |
| **Paper type** | 80 gsm / 120 gsm / 170 gsm Glossy / 250 gsm Matte | `data-price-add` |
| **Sides** | Single-sided / Double-sided | `data-multiplier` (1.0 / 1.7) |
| **Color mode** | Full color / Black & White | `data-multiplier` (1.0 / 0.4) |
| **Finishing** | None / Lamination / Binding / Cutting | `data-price-add` per option |

### `components/product/quote-calc.twig` — Live Quote Panel

A sticky sidebar / mobile-bottom-bar panel that updates in real time without any
server round-trip:

- **Unit price** — base product price × size multiplier × sides multiplier × color multiplier + type add-ons + finishing add-ons.
- **Quantity** — reflects the stepper value.
- **Subtotal** — unit price × quantity.
- **Estimated delivery** — `today + delivery_base_days + 2 days if qty > 100 + 1 day if Binding is selected`, formatted with `Intl.DateTimeFormat` in the store's locale.

### `components/product/upload-zone.twig` — Design File Upload

A fully-featured drag-and-drop upload area:

- Accepts formats defined by the `accepted_file_types` setting.
- Shows inline thumbnail previews for images; file-type badges for PDF / AI / PSD.
- Multi-step status: **idle → reading → uploading (progress bar) → uploaded**.
- Hooks into `salla.uploader` when available; falls back to a standard
  `<input type="file" name="design_file">` attached to the product form.

### Add-to-cart payload

When the customer clicks **Add to Cart**, `product.js` assembles a payload that includes:

```js
{
  product_id: <id>,
  quantity:   <qty>,
  options:    [ /* Salla product option selections */ ],
  notes:      "A4 · 170gsm Glossy · Double-sided · Color · Finishing: Lamination",
  // design_file_id included when a file has been uploaded via salla.uploader
}
```

The `notes` field gives the merchant a human-readable print specification summary
directly in the order view.

---

## Localization

All user-visible strings pass through Twig's `| t` filter and are defined in
`src/locales/en.json` and `src/locales/ar.json`.

Key namespaces:

| Namespace | Coverage |
|-----------|---------|
| `common.*` | Buttons, navigation labels, close, menu |
| `product.*` | Options, paper size/type, sides, color mode, finishing |
| `quote.*` | Unit price, quantity, subtotal, delivery ETA labels |
| `upload.*` | Drop-zone prompts, accepted formats, status messages |
| `cart.*` | Cart totals, coupon, item actions |
| `auth.*` | Login / register |
| `account.*` | Profile, orders, wishlist |
| `search.*` | Placeholder, submit, empty state |
| `nav.*` | Navigation links |
| `categories.*` | Category listing |
| `blog.*` | Blog list / article labels |
| `brands.*` | Brand listing labels |

---

## JavaScript Architecture

| File | Responsibility |
|------|---------------|
| `theme.js` | **Global** — back-to-top, sticky shadow, active nav highlight, generic qty stepper (`.btn-plus` / `.btn-minus`), mobile drawer (open / close / ESC / focus trap), mobile search toggle, upload-zone dragover classes, Salla `cart.updated` badge sync. |
| `product.js` | **Product page** — option selection, print-specs reactive state machine, live quote & ETA calculation, upload zone (drag + progress + previews), add-to-cart wiring via `salla.cart.addItem`. |
| `cart.js` | **Cart page** — quantity updates via `salla.cart.updateItem`, removal via `salla.cart.deleteItem`, coupon apply via `salla.cart.applyCoupon`, full totals refresh, empty-cart reload. |

All scripts are vanilla JavaScript + jQuery (loaded via Bootstrap 4 CDN bundle).
No build step, no transpilation — runs as-is in any modern browser.

---

## Salla Approval Checklist

- [x] `twilight.json` present at root with a valid schema (version, theme_name, settings, features, components).
- [x] Canonical Salla page paths preserved — `pages/cart.twig`, `pages/product/single.twig`, `pages/product/index.twig`, etc.
- [x] `master.twig` calls `{{ salla.head() }}` (in `<head>`) and `{{ salla.footer() }}` (before `</body>`).
- [x] Native Salla checkout used — no custom checkout page exists.
- [x] All user-visible strings use `| t` and are defined in `src/locales/{en,ar}.json`.
- [x] No hardcoded merchant data — everything reads from `store.*`, `customer.*`, `product.*`, `cart.*`, or `theme.settings.get(...)`.
- [x] RTL-safe CSS via `[dir="rtl"]` selectors; `dir="{{ store.direction }}"` on `<html>`.
- [x] Product images use `loading="lazy"`; CSS in `<head>`; JS at end of `<body>` (Web Vitals).
- [x] Accessibility: `<label>` on every form control, `alt` on every `<img>`, `aria-label` on icon-only buttons, keyboard-navigable upload zone, focus-visible rings.
- [x] `prefers-reduced-motion` media query respected for all CSS transitions and animations.
- [x] Salla SDK used correctly: `salla.cart.addItem`, `salla.cart.updateItem`, `salla.cart.deleteItem`, `salla.cart.applyCoupon`, `salla.event.on('cart.updated')`.

---

## License

MIT
