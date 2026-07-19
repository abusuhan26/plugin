# AxGens Tier Studio

A separated HTML/CSS/JavaScript website that visually generates an axGens-compatible `tiers.yml` file.

## Included features

- Dark claymorphism + glassmorphism interface with animated gradients, hover effects, modal transitions, ripple buttons and responsive layouts.
- 1–100 continuous tiers.
- Generator item category:
  - `remove-from-shop` and `allow-buying` toggles.
  - Searchable Minecraft block picker.
  - Bukkit/Paper material IDs such as `HAY_BLOCK`.
  - Drop-based or custom generator name.
  - Exponential level requirement: `base × hardness^(tier - 1)` with a 0.01–20.00 slider.
  - Tier 1 price plus custom formula.
  - Fixed, ±0.1×, or custom generation-time progression.
  - Toggleable lore placeholders based on the uploaded YAML documentation.
- Drop item category:
  - Multiple drop items.
  - Locked 100% chance.
  - Searchable item picker.
  - Tier 1 sell price plus custom formula.
  - Item name used automatically as the drop name.
  - Fixed drop lore matching the uploaded YAML.
- Hologram category:
  - Enable/disable toggle.
  - Height control.
  - Shared multiline editor.
  - Generator name locked as the first hologram line.
  - Placeholder insertion buttons.
- Live tier cards, YAML preview, copy and `tiers.yml` download.

## Formula syntax

Available variables:

- `t` — current tier number.
- `prev` — previous tier value.
- `base` — tier 1 value.
- `x` — reserved custom multiplier.

Available functions:

- `sqrt(value)`
- `root(value, degree)`
- `square(value)`
- `cube(value)`
- `min(...)`, `max(...)`, `abs(...)`
- `round(...)`, `floor(...)`, `ceil(...)`, `pow(value, exponent)`

Power syntax may use either `^` or `pow()`. Examples:

```text
prev * 1.5
base * t^2
square(t) * base
root(prev, 2) * 100
max(20, prev * 0.9)
```

## Minecraft data and textures

The website attempts to load Minecraft Java 1.21.8 data from:

- `PrismarineJS/minecraft-data` for block/item metadata.
- `PrismarineJS/minecraft-assets` for textures.

A small built-in fallback list is used when the browser cannot reach GitHub. For production, you can download those JSON and PNG assets into your own hosting/CDN and replace `DATA_BASE` and `ASSET_BASE` at the top of `js/app.js`.

## Running locally

Because the page fetches remote JSON, use a local HTTP server instead of opening `index.html` directly:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

You can also deploy the folder directly to GitHub Pages, Netlify, Vercel or any static hosting service.

## Files

```text
index.html
css/style.css
js/app.js
sample/original-tiers.yml
```
