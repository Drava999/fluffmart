# FloofMart tune-up: handover

This brief is for whoever (person or AI model) finishes the FloofMart tune-up. It covers what the owner wants, what is already built and tested, the exact patches to apply, what is still open, and how to check the work.

**Live preview of the finished result:** https://claude.ai/artifact/EJWUA6wMPd6iZXC8SZCxs6 (private to the owner). It shows the app three ways, side by side: as it is today, cleaned, and cleaned plus three features.

---

## 1. The project in one paragraph

FloofMart TCG is a Pokémon card shop in Singapore that runs as a **Telegram Mini App**. The whole front end is **one vanilla HTML/CSS/JS file**, with no framework, no build step and no package.json. The backend is a Cloudflare Worker (`fluffmart-api` / `fluffmart-api-staging`) with a D1 database. It is not in this repo.

| File | What it is |
|---|---|
| `index.html` | The live shop. |
| `staging/index.html` | The test shop (shows a yellow "TEST SHOP" bar and talks to the staging Worker). **It is newer than `index.html` and differs by about 780 lines.** Both need the same changes. |
| `logo.png`, `wooloo*.png/gif`, `qrcode.min.js`, `bgm.mp3` | Assets loaded by relative path. |
| `.claude/skills/` | Design skills (Emil Kowalski, Taste, Impeccable, Telegram Mini App). See `.claude/skills/README.md`. |

The app has a **built-in demo mode**: when `API_URL` is empty it uses `mock()` and `DEMO_INV` / `DEMO_ORDERS`. The test tools in `tools/` rely on it.

---

## 2. What the owner asked for (hard constraints)

- **Clean up and polish. No redesign or overhaul.**
- **Do not touch search, filters or sorting.**
- Keep the brand: cream and pink palette, **Fraunces + Plus Jakarta Sans fonts, emoji icons, the six-tab bottom bar, and all copy.**
- Keep the **gold shimmer on under-market prices** (`.price:has(.was)`). It uses gradient text on purpose, and the code says so.
- Keep the looping mascot animations for now.
- **Test on staging (`staging/index.html`) before touching the live `index.html`.** Don't merge to `main` without the owner's go-ahead.
- Work on branch `claude/fluffmart-repo-access-0nhw3q` (or whatever branch the owner names).

---

## 3. Task 1: apply the cleanup (ready, tested)

Apply in this order, staging first:

```bash
git apply handover/tuneup/cleanup-staging.patch   # staging/index.html
# test staging (section 6), then:
git apply handover/tuneup/cleanup.patch           # index.html
```

Both patches were generated from the same transformation and checked with `git apply` against this branch at commit `fe22382`. If either file has changed since then and a patch no longer applies, re-apply the changes by hand using the list below. Every change is small and self-contained.

### What the cleanup changes

Almost all of it is CSS appended at the end of the main `<style>` block under `/* ===== FloofMart cleanup pass ===== */`, plus one small `<script>` before `</body>`. Existing rules are overridden, not edited, so the change is easy to review and revert.

**Readability (WCAG AA contrast)**. Measured result: 143 failing text items across 25 screens (113 light, 30 dark) went down to 0.
- `:root{--fawn-deep:#9E4686;--berry-deep:#9E4686;--link:#9E4686}` (was `#A84E8E` / `#B25C93`) and `:root{--hint:#765970}` (was `#8a6b80`). Both now clear 4.5:1 on `--bg` and on `--ruff`. Light theme only: the dark theme's `:root[data-theme="dark"]` block wins on specificity and keeps its own values.
- Filled pink surfaces with white text move from `--fawn`/`--berry` (#D98EC0, 2.45:1) to `--fawn-deep`: `.cta` (every main button: Place order, Pay, Add to cart, Send offer, Save address, Next…), `.chip.on`, `.wtab.on`, `.ostg.on`, `.pt-tabs .chip.on` (staging only), `.rate-b`, `.loyal-refb`.
- `.hero` and `.oact-hd` (the pink "$X to pay" banner) use a berry gradient `#A84E8E → #9C4785/#9A4583`.
- Darker text on tinted tags: `.htag.ok #237152`, `.htag.way #2B6682`, `.htag.wait #7F5A00`, `.pay-warn #6E5500`, `.inv-badge #85520A`, `.stock-tag #5f4500`, `.jnew #5f4500` (and 9.5px instead of 8.5px). The inline `#c2405e` bank-name warning at checkout becomes `#A8324F`.
- **Dark theme:** accents get *lighter* in dark mode (`--fawn-deep:#F0A8D2`), so white text on filled pink fails at 1.87:1. All filled pink buttons and chips get `color:#2A1024` in dark mode. `.fchip`, `.pdfb` and `.fc` had hard-coded `#fff` backgrounds that showed as bright squares in dark mode. They now use `var(--card)` / `var(--ruff)`.

**Accessibility**
- Viewport: removed `maximum-scale=1`, so pinch-zoom works again (WCAG 1.4.4). Inputs are forced to 16px so iOS doesn't auto-zoom on focus, which was the likely reason zoom was disabled.
- `<button class="rm">` and `.cv-close` get `aria-label="Close"`. `.rm`, `.cv-close` and `.zoom-close` get a 44×44 minimum. `.doc-close` and `.pdfb` get a larger invisible hit area via `::after`, so their look doesn't change.
- The cleanup script gives every `div[onclick]` / `span[onclick]` `role="button"` and `tabindex=0` (through a MutationObserver, since most of the UI is rendered from JS strings). Enter and Space activate them.
- Settings toggles (`button.switch`) get `role="switch"`, `aria-checked` kept in sync with the `.on` class, and `aria-label` taken from the row's `.set-t`.
- `:focus-visible` gets a 2px berry outline.

**Telegram**
- `tg.disableVerticalSwipes()` (Bot API 7.7+, guarded by `isVersionAtLeast`), so pull-to-refresh no longer triggers Telegram's swipe-to-close.
- `tg.setBackgroundColor` / `tg.setBottomBarColor` set to the page background (7.10+, guarded), so Telegram's own chrome matches the cream app.
- A `themeChanged` listener re-runs `applyPrefs()` and re-syncs the colours, so switching Telegram's theme mid-session updates the app. Before, `tg.colorScheme` was read once at launch.

**Motion** (following Emil Kowalski's rules: custom ease-out, UI animation under 300ms, exits faster than entrances, no bounce)
- Every `cubic-bezier` with an overshoot value above 1 (4 definitions, flagged 19 times by the Impeccable detector) becomes `cubic-bezier(.22,1,.36,1)`.
- `pageFlipL/R` go from `.18s ease-in` to `.18s cubic-bezier(.23,1,.32,1)`.
- `.pcard:active` had a keyframe bounce (`pop2`, which restarted on every tap) plus a second `scale(.97)` rule. It now has one rule: a 160ms transition to `scale(.97)`.
- `.sheet` opens in 380ms `cubic-bezier(.32,.72,0,1)` (iOS drawer curve) and closes in 200ms ease-out.
- `.cv-panel` scales from .96 in 200ms (was .94 / .24s). The card-view scrim fades in 150ms.

**Bugs and layout**
- Removed the duplicate `<div class="grid" id="storeGrid">` (index.html line ~1778). `getElementById` only ever found the first one.
- **Cancel on unpaid orders** (`payRowHtml`): it was a tiny underlined `.linkish` link inside the order-id line (`#EF9ZT4 · Cancel`). It's now a `button.pyrow-x` reading "Cancel order", placed under the amount in `.pyrow-a`. It's a quiet outlined pill with a 44px hit area that turns red on hover (mouse only). The timed-out "Clear" button in `stageBodyHtml` uses the same class. `cancelUnpaid()` and its `showConfirm` prompt are unchanged.

---

## 4. Task 2: apply the three features (ready, tested)

Only after the cleanup, because the features patch builds on it:

```bash
git apply handover/tuneup/features-staging.patch
git apply handover/tuneup/features.patch
```

Everything is in a `<style>` addition and a `<script>` under `/* ===== FloofMart proposed features ===== */`, plus one small change to the store tile template in `renderStore()`.

1. **Fly to cart.** This wraps `window.addToCart`. It clones the tile photo (or the card-view photo) and animates it with the Web Animations API to the Cart tab: 560ms, `cubic-bezier(.77,0,.175,1)`, scaling to .12. It's skipped when `data-motion="reduced"` (the Settings motion toggle or the OS setting), and it always calls the original `addToCart`.
2. **Holo tilt on rare cards.** In the card view, cards whose rarity tag matches `/illustration|special art|secret|mega attack|hyper/i` tilt up to ±9° following the pointer, with a colour-dodge sheen. Common cards stay flat. Skipped with reduced motion.
   - **Still to do:** drive it from the phone's gyroscope inside Telegram (`tg.DeviceOrientation`, Bot API 8.0+, guarded) with the same maths. Pointer events don't fire on a phone that isn't being touched.
3. **"New since your last visit".** `FM_isNew(c)` is true when `c.dateAdded` is later than the person's previous visit. The previous visit is read with the app's own `_load('fm_last_seen')` (localStorage, then CloudStorage) and saved with `_store` whenever the app is hidden (`visibilitychange` / `pagehide`). A first visit shows no tags. Store tiles reuse the existing yellow `.jnew` tag, positioned bottom-left. The "Just in" rail keeps its current rule (within 3 days of the newest card). The owner may want the rail to follow the same rule.
   - Tested: a returning visitor last seen 10 Sep got NEW on a card added 14 Sep only. A first-time visitor got none.

---

## 5. Task 3: open proposals (not built; the owner decides)

Build these only if the owner asks. They're listed roughly by value against effort.

| Proposal | What it does | Hints |
|---|---|---|
| **Notify me on claimed cards** | The "Claimed" overlay on a sold-out tile gets a "Notify me" button that adds the card to the wishlist in one tap. | The wishlist already exists (`openWishlist`, `wishlistAdd` API, `kind:'name'`). Pre-fill the card's name. Small. |
| **Payment countdown** | Show the remaining payment window at checkout, e.g. "Pay $85.00 · 9:42". | `paymentWindowMins` / `o.payWindowMins`, `createdMs`. The `.inv-badge` already shows a timer. Consider Telegram `MainButton` for Pay. Small. |
| **Merge the triple "to pay"** | An unpaid order shows its amount three times on Orders: the `.oact` banner, the `.ostg.on` "To pay" tile and the `.pyrow` row. | Layout change, so confirm with the owner first. |
| **Send a card to a friend** | A share button in the card view posts the card to a Telegram chat, with a deep link that opens the Mini App on that card. | `startapp` parameter plus `tg.shareMessage` / `switchInlineQuery`. Needs bot configuration. Medium. |
| **Recently viewed** | A small rail on Home showing the last cards opened. | `_store`/`_load` a list of ids on `openCardView`. Small. |
| **Haul summary after paying** | The purchased cards fanned out with Wooloo before the order screen. | `showPaidHaul` and the card fan (`fanHtml`) already exist. Medium. |
| **Reduced motion** | The current `prefers-reduced-motion` block sets every duration to .01ms, which also removes useful fades. | Keep opacity transitions and remove only movement. Small. |
| **Looping animations** | 13 `infinite` animations (floaty, pokewobble, ubpulse, shimmer…). | Keep loading spinners. Play decorative loops once on arrival. Owner's call. |

**Other Impeccable detector findings left alone**, because they're style choices or minor: 11 thick accent borders on rounded elements (`border-bottom:2.5px` section underlines), 2 zero-offset glow shadows, 1 `max-height` transition (accordion), 1 `<img>` without `src` (filled later by JS), 3 cramped-padding spots, overused fonts (owner is keeping them) and em-dashes in copy (owner is keeping the copy).

---

## 6. How to check your work

Tools are in `handover/tuneup/tools/`. They need Python 3 and Node with `playwright-core` and a Chromium.

```bash
# 1. Make an offline demo copy (demo mode, no guide, placeholder photos, one unpaid order)
python3 handover/tuneup/tools/make-demo-copy.py staging/index.html /tmp/demo.html

# 2. Scan 25 screens and sheets for low-contrast text, in light and dark
node handover/tuneup/tools/contrast-scan.js /tmp/demo.html /tmp/shots
node handover/tuneup/tools/contrast-scan.js /tmp/demo.html /tmp/shots-dark dark
```

**Expected after the cleanup:** only known false alarms remain. These are the struck-through "was" price inside the deliberate shimmer, emoji icons (🔍 🃏 📄), and 🐑, which replaces the logo when the demo copy is opened outside the repo folder. Before the cleanup, the same scan reports 113 items in light and 30 in dark. Look at the screenshots too: the scan measures colour, not layout.

**Impeccable's detector** (downloads its engine on first run and checks its SHA-256):
```bash
.claude/skills/impeccable/scripts/impeccable detect --json staging/index.html
```
After the cleanup, `bounce-easing` should be gone. The findings listed at the end of section 5 are expected to remain.

**Inside Telegram** (can't be tested in a browser), on the staging shop:
- Dragging down at the top of a page refreshes the shop and doesn't close the Mini App.
- Telegram's header and bottom bar are cream, not grey.
- Switching Telegram between light and dark while the app is open updates the app.
- Pinch-zoom works, and tapping the search box doesn't zoom the page.
- Checkout: Place order, the PayNow QR and Pay all work. On an unpaid order, "Cancel order" asks for confirmation, then cancels.
- Telegram Desktop: keyboard Tab/Enter opens cards, and focus rings are visible.

---

## 7. Gotchas

- `.cta` gets its colour from `--berry`, not `--fawn`. Both are the same light pink (#D98EC0). Change both when touching button colours.
- The dark theme is `:root[data-theme="dark"]`, set by `applyPrefs()` from the Settings choice or `tg.colorScheme` / the OS setting. In dark mode, accents go *lighter*, so filled accent surfaces need dark text.
- Most UI is built from JS template strings (`renderStore`, `openCardView`, `payRowHtml`…). Attribute changes like roles and labels need either a string edit or the MutationObserver approach used in the cleanup script.
- `STATE.inventory` items come from `mergeInventory()`. Buyers never see cards without a photo (`faceList(c)` empty), so demo data needs images or the store looks empty.
- The same `.jnew` class is used by the "Just in" rail. Its position in store tiles is overridden only under `.pcard .img .jnew`.
- Custom scrollbars were removed before ("fix pack 19 S1", because two stacked scrollbars appeared). Don't reintroduce them. Horizontal rails already hide their scrollbars.

---

## 8. Files in this folder

| File | Purpose |
|---|---|
| `HANDOVER.md` | This brief. |
| `cleanup-staging.patch` / `cleanup.patch` | Section 3, for `staging/index.html` and `index.html`. |
| `features-staging.patch` / `features.patch` | Section 4. Apply after the matching cleanup patch. |
| `tools/make-demo-copy.py` | Builds an offline demo copy for testing. Never deploy its output. |
| `tools/contrast-scan.js` | Screenshots 25 screens and reports low-contrast text. |
