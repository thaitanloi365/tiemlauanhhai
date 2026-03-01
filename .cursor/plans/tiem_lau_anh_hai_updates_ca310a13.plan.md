---
name: tiem lau anh hai updates
overview: "Refactor the landing page and components: move the menu grid to a dedicated `/menu` route, add a page-flip book for `menu.jpeg`, convert Cart to a right-side drawer with animation, add a FAB-style FloatingContact, animate all pages, and polish Header/Footer."
todos:
  - id: menu-book
    content: Create MenuBook.svelte with CSS 3D page-flip animation (10 dummy pages of menu.jpeg)
    status: completed
  - id: menu-page
    content: Create /menu route (+page.svelte + +page.server.ts) with MenuFilter + MenuItem grid
    status: completed
  - id: home-page
    content: Strip +page.svelte to hero section only, swap img for MenuBook
    status: completed
  - id: header
    content: Remove Admin link, update Thực đơn href to /menu
    status: completed
  - id: cart-drawer
    content: Rewrite Cart.svelte as right-side drawer with fly/fade transitions
    status: completed
  - id: fab
    content: Rewrite FloatingContact.svelte as animated FAB with fan-out contacts
    status: completed
  - id: footer-icons
    content: Replace Footer social text links with inline SVG icons
    status: completed
  - id: layout-anim
    content: Add page-entry transitions in +layout.svelte
    status: completed
  - id: seed-data
    content: Expand seed.sql and mock-db.ts with full topping + drink items
    status: completed
isProject: false
---

# Tiệm Lẩu Anh Hai — Feature Updates

## Summary of changes

- Home page (`/`) keeps only the hero `container-shell` section with a page-flip book replacing the static `menu.jpeg`
- New `/menu` route holds the menu grid (MenuFilter + MenuItem cards)
- Header loses the "Admin" link; "Thực đơn" points to `/menu`
- Cart becomes a right-side slide-in drawer with Svelte CSS transitions
- FloatingContact becomes a single FAB that fans out contacts on click
- Global page-entry animations via `+layout.svelte` transitions
- Footer social links get inline SVG icons (Facebook, Zalo, TikTok)
- `seed.sql` + `mock-db.ts` get full topping and drink data

---

## Files to create

### `src/lib/components/MenuBook.svelte`

CSS 3D page-flip book. 10 dummy pages all using `/menu.jpeg`. Shows two "pages" side-by-side (book spread). Clicking the right page or arrow buttons animates a `rotateY` flip to reveal the next spread.

```
State: currentSpread (0-4), isFlipping (bool)
5 spreads × 2 pages = 10 pages
CSS perspective + rotateY(-180deg) transition ~600ms
Prev / Next chevron buttons overlaid on the book
```

### `src/routes/menu/+page.svelte`

Moved menu content (MenuFilter + grid of MenuItem cards). Mirrors structure of current inline menu section in `+page.svelte`.

### `src/routes/menu/+page.server.ts`

Identical load function to current `+page.server.ts` (fetches categories + filtered menu items from Supabase / mock-db).

---

## Files to modify

### `[src/routes/+page.svelte](src/routes/+page.svelte)`

Keep only the hero `<section class="container-shell py-8">` block. Replace `<img src="/menu.jpeg">` with `<MenuBook />`. Remove the `id="menu"` section and its imports.

### `[src/lib/components/Header.svelte](src/lib/components/Header.svelte)`

- Remove `<a href="/admin">Admin</a>` from nav
- Change `href="/#menu"` → `href="/menu"` for "Thực đơn" link

### `[src/lib/components/Cart.svelte](src/lib/components/Cart.svelte)`

Convert from bottom-sheet to right-side drawer:

```svelte
<!-- Drawer panel -->
<div class="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl"
     transition:fly={{ x: 400, duration: 350, easing: cubicOut }}>
```

Backdrop stays as `fixed inset-0 bg-black/40` with a `transition:fade`.

### `[src/lib/components/FloatingContact.svelte](src/lib/components/FloatingContact.svelte)`

Replace the always-visible stack with a FAB pattern:

```
State: open (bool)
Main FAB: fixed bottom-20 right-4, 56px circle, orange, "+" rotates to "×" when open
On open: 3 child buttons fan out upward with staggered fly+fade transitions
  - Phone (tel icon)
  - Zalo (chat icon)
  - Facebook (messenger icon)
```

### `[src/lib/components/Footer.svelte](src/lib/components/Footer.svelte)`

Replace text links with inline SVG icon buttons (24×24px) for Facebook, Zalo, TikTok.

### `[src/routes/+layout.svelte](src/routes/+layout.svelte)`

Add page transition using SvelteKit's `$page` store and Svelte's `fly` transition:

```svelte
{#key $page.url.pathname}
  <div in:fly={{ y: 20, duration: 300, delay: 100 }} out:fly={{ y: -10, duration: 200 }}>
    {@render children()}
  </div>
{/key}
```

### `[supabase/seed.sql](supabase/seed.sql)`

Add full topping items (Bắp bò 80k, Bò mềm 70k, Cá hú 70k, Tôm 50k, Mực 50k, Rau lẩu mắm 30k, Rau lẩu chả cá 30k, Bún 10k, Mì gói 3k) and drink items (Nước dừa tươi 25k, Trà đá 5k, Nước suối 10k), each with one variant.

### `[src/lib/server/mock-db.ts](src/lib/server/mock-db.ts)`

Mirror seed.sql data so the local dev experience (no Supabase) shows all menu categories and items.