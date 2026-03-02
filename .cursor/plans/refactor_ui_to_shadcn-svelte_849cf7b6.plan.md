---
name: Refactor UI to shadcn-svelte
overview: Refactor toàn bộ UI của project tiemlauanhhai sang sử dụng shadcn-svelte components, thay thế các custom CSS classes (btn-primary, card-surface, ...) bằng các component có sẵn từ shadcn, đồng thời thêm Chart (LayerChart) cho trang Thống kê.
todos:
  - id: setup
    content: "Phase 1: Init shadcn-svelte, cai dependencies, configure components.json, customize theme trong app.css"
    status: completed
  - id: add-components
    content: "Phase 1: Add tat ca shadcn components can thiet (button, card, input, select, dialog, sheet, table, tabs, badge, alert, skeleton, chart, ...)"
    status: completed
  - id: admin-components
    content: "Phase 3.2: Refactor 3 admin components (AdminSidebar, MenuItemForm, EmployeeForm)"
    status: completed
  - id: admin-pages
    content: "Phase 3.3: Refactor 7 admin pages (login, dashboard, employees, menu, orders, order detail, settings)"
    status: completed
  - id: statistics-charts
    content: "Phase 3.4: Refactor statistics page voi Bar Chart cho 'Doanh thu theo thang' va Horizontal Bar Chart cho 'So luong theo khu vuc'"
    status: completed
  - id: public-components
    content: "Phase 3.5: Refactor 17 public components (Header, Footer, Cart, MenuItem, OrderForm, ...)"
    status: completed
  - id: public-pages
    content: "Phase 3.6: Refactor 5 public pages (home, menu, menu detail, cart, orders)"
    status: completed
  - id: cleanup
    content: "Phase 3.7: Xoa custom utility classes cu (btn-primary, btn-secondary, card-surface), don dep app.css"
    status: completed
isProject: false
---

# Refactor UI sang shadcn/ui for Svelte

## Hien trang

Project dang dung Svelte 5 (v5.51) + Tailwind CSS v4 (v4.2) + Vite 7 voi custom styling:

- Custom utility classes: `btn-primary`, `btn-secondary`, `card-surface`, `container-shell`
- 20 components trong `src/lib/components/`
- 14 pages + 2 layouts trong `src/routes/`
- Khong co component library nao (no bits-ui, no shadcn-svelte)
- Theme mau cam/nau (orange/brown brand colors)

## Phase 1: Setup shadcn-svelte

### 1.1 Khoi tao shadcn-svelte

Chay CLI de init:

```bash
npx shadcn-svelte@latest init
```

Config `components.json`:

- Base color: **Neutral** (de tu customize sang orange brand)
- Global CSS: `src/app.css`
- Component alias: `$lib/components/ui`

Se tu dong cai dat dependencies: `bits-ui`, `clsx`, `tailwind-variants` hoac `tailwind-merge`, `lucide-svelte`.

### 1.2 Cai dat TanStack Query + TanStack Table

**Dependencies:**

```bash
npm install @tanstack/svelte-query @tanstack/table-core
```

**Setup QueryClientProvider** trong [src/routes/+layout.svelte](src/routes/+layout.svelte):

```svelte
<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,    // 30s truoc khi refetch
        refetchOnWindowFocus: false,
      }
    }
  });
  let { children } = $props();
</script>
<QueryClientProvider client={queryClient}>
  {@render children()}
</QueryClientProvider>
```

### 1.3 Rewrite app.css -- Xu ly xung dot global styles

File [src/app.css](src/app.css) hien tai co rat nhieu global styles se **xung dot truc tiep** voi shadcn components. Can xu ly tung phan:

**XOA hoac thay the (se conflict voi shadcn):**

- **Dong 3-12: Custom CSS variables** (`--color-primary`, `--color-surface`, ...) -> Thay bang shadcn theme variables (`--primary`, `--secondary`, `--background`, `--card`, `--border`, ...) theo format OKLCH. Map brand colors:
  - `--primary` -> orange #f47b20
  - `--secondary` -> brown #8b4513
  - `--accent` -> green #228b22
  - `--background` -> cream #fff8f0
  - `--card` -> antique white #faebd7
  - `--muted`, `--border`, `--input`, `--ring` -> cac shade orange/brown phu hop
  - `--destructive` -> red cho errors
  - `--chart-1` den `--chart-5` -> cac mau cho Charts
- **Dong 25-61: Custom radio styling** -> XOA HOAN TOAN. shadcn `RadioGroup` tu handle styling.
- **Dong 78-84: `.btn-primary` / `.btn-secondary`** -> XOA. Thay bang shadcn `<Button variant="default">` / `<Button variant="outline">`.
- **Dong 74-76: `.card-surface`** -> XOA. Thay bang shadcn `<Card.Root>`.
- **Dong 87-114: Global input/textarea/select styling** -> XOA HOAN TOAN. Day la phan nguy hiem nhat -- cac selector global nhu `input:not(...)`, `textarea`, `select` se override shadcn `Input`, `Select`, `Textarea` components. shadcn components tu co styling rieng.
- **Dong 104-121: `.admin-area` overrides** -> XOA. Khong can thiet khi dung shadcn components.
- **Dong 123-135: Global button/link cursor** -> XOA. shadcn `Button` da co cursor handling.

**GIU LAI:**

- **Dong 14-23: html/body base styles** -> Giu nhung doi sang dung shadcn variables: `background: hsl(var(--background))`, `color: hsl(var(--foreground))`. Giu font Montserrat.
- **Dong 63-68: Heading font** -> Giu Playfair Display cho h1-h4.
- **Dong 70-72: `.container-shell`** -> Giu (utility layout, khong conflict).
- **Dong 137-163: Reveal animations** -> Giu nguyen (custom `use:reveal` action + CSS).
- **Dong 165-207: View transitions + reduced motion** -> Giu nguyen.

**ANIMATION STRATEGY:** Giu Svelte built-in transitions (`fly`, `scale`, `fade`, `slide` tu `svelte/transition`) + CSS animations hien tai. KHONG them animation library ngoai (framer-motion / svelte-motion). Ly do: stable, zero dependencies them, du dung cho restaurant app.

- Modal/drawer open-close: Svelte `fly`/`slide` transitions (nhu hien tai)
- Reveal on scroll: Giu custom `use:reveal` action + CSS `reveal-fade-up`
- Page transitions: Giu native View Transitions API
- MenuBook flip: Giu custom CSS keyframes
- Hover/tap feedback: Tailwind `hover:` / `active:` classes (shadcn Button da co san)

**Ket qua app.css sau khi rewrite:**

```css
@import "tailwindcss";

/* shadcn-svelte theme variables (generated by CLI + customized) */
@theme inline {
  /* Brand-mapped colors in OKLCH */
  --color-background: oklch(...);   /* #fff8f0 cream */
  --color-foreground: oklch(...);   /* #3d2314 dark brown */
  --color-primary: oklch(...);      /* #f47b20 orange */
  --color-primary-foreground: oklch(...); /* white */
  --color-card: oklch(...);         /* #faebd7 antique white */
  /* ... other shadcn variables ... */
  --color-chart-1: oklch(...);      /* orange for revenue chart */
  --color-chart-2: oklch(...);      /* brown for area chart */
  /* ... */
}

body {
  font-family: 'Montserrat', system-ui, sans-serif;
}

h1, h2, h3, h4 {
  font-family: 'Playfair Display', Georgia, serif;
}

.container-shell {
  @apply mx-auto w-full max-w-6xl px-4 sm:px-6;
}

/* Reveal animations (giu nguyen) */
/* View transitions (giu nguyen) */
/* Reduced motion (giu nguyen) */
```

### 1.4 Add shadcn components

```bash
npx shadcn-svelte@latest add button card input label select textarea badge \
  table data-table tabs alert dialog sheet separator skeleton checkbox \
  radio-group chart dropdown-menu
```

Se tao ra `$lib/components/ui/` voi cac component tuong ung. `data-table` cung cap `createSvelteTable`, `FlexRender`, `renderComponent`, `renderSnippet` helpers cho TanStack Table.

## Phase 2: Mapping component cu sang shadcn

### Bang anh xa UI patterns

- `btn-primary` / `btn-secondary` -> `<Button variant="default">` / `<Button variant="outline">`
- `card-surface` -> `<Card.Root>` / `<Card.Content>`
- `<select>` + custom CSS -> `<Select.Root>` / `<Select.Trigger>`
- `<input>` + custom CSS -> `<Input>`
- `<textarea>` + custom CSS -> `<Textarea>`
- Modal overlays (fixed inset-0 z-50) -> `<Dialog.Root>` / `<Dialog.Content>`
- Drawer/BottomSheet (slide up) -> `<Sheet.Root>` / `<Sheet.Content side="bottom">`
- Table (custom) -> `<Table.Root>` / `<Table.Header>` / `<Table.Row>` / `<Table.Cell>`
- Tab buttons -> `<Tabs.Root>` / `<Tabs.List>` / `<Tabs.Trigger>`
- Error messages -> `<Alert variant="destructive">`
- Loading skeleton -> `<Skeleton>`
- Status badges -> `<Badge>`

## Phase 3: Refactor tung nhom file

### 3.1 Layout & Navigation (2 files)


| File                                                               | Thay doi                                                    |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| [src/routes/+layout.svelte](src/routes/+layout.svelte)             | Them Google Fonts import (neu chua co), dam bao theme apply |
| [src/routes/admin/+layout.svelte](src/routes/admin/+layout.svelte) | Dung `Sheet` cho mobile sidebar                             |


### 3.2 Admin components (3 files)


| Component                                                           | Thay doi                                                                                                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [AdminSidebar.svelte](src/lib/components/admin/AdminSidebar.svelte) | Dung `Sheet` (mobile), `Button`, `Separator`, `Dialog` cho logout confirm                                     |
| [MenuItemForm.svelte](src/lib/components/admin/MenuItemForm.svelte) | `Dialog` thay modal, `Input`/`Select`/`Textarea`/`Label`/`Checkbox` thay form elements, `Button` thay buttons |
| [EmployeeForm.svelte](src/lib/components/admin/EmployeeForm.svelte) | `Dialog`, `Input`/`Select`/`Label`, `Button`, `Alert` cho errors                                              |


### 3.3 Admin pages -- TanStack Query + Data Table

**Hien trang:** Tat ca admin pages deu dung `fetch()` trong `onMount()` -- khong co caching, khong pagination, khong auto-refetch.

**Refactor:** Chuyen sang `createQuery` tu `@tanstack/svelte-query` + shadcn `data-table` voi pagination.

#### Admin Orders -- Data Table co pagination + sorting + filter

[src/routes/admin/orders/+page.svelte](src/routes/admin/orders/+page.svelte)

Hien tai: `fetch('/api/admin/orders')` trong `onMount`, load het 1 lan, khong pagination.

Sau refactor:

- `createQuery` de fetch data (co caching, auto-refetch, loading/error states)
- shadcn `DataTable` voi `createSvelteTable` + `getPaginationRowModel` + `getSortedRowModel` + `getFilteredRowModel`
- Column definitions: Ma don, Khach hang, Tong tien, Trang thai (`Badge`), Ngay dat, Actions (`DropdownMenu`)
- Filter by status (`Select`), search by customer name/phone (`Input`)
- Pagination controls: Previous/Next buttons, page size selector

```svelte
const ordersQuery = createQuery(() => ({
  queryKey: ['admin', 'orders', { status, q }],
  queryFn: () => fetch(`/api/admin/orders?status=${status}&q=${q}`).then(r => r.json()),
}));
```

#### Admin Employees -- Data Table co pagination

[src/routes/admin/employees/+page.svelte](src/routes/admin/employees/+page.svelte)

Hien tai: `fetch('/api/admin/employees')` trong `onMount`, load het 1 lan.

Sau refactor:

- `createQuery` de fetch
- shadcn `DataTable` voi pagination (10 rows/page)
- Columns: Email, Ten hien thi, Vai tro (`Badge`), Ngay tao, Actions (Edit/Delete)
- `queryClient.invalidateQueries(['admin', 'employees'])` khi create/edit/delete thanh cong

#### Cac trang admin khac


| Page                                                           | Thay doi                                                                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [admin/login](src/routes/admin/login/+page.svelte)             | `Card`+`Input`+`Label`+`Button` (khong can TanStack Query -- form submit thong thuong)                                               |
| [admin/+page](src/routes/admin/+page.svelte)                   | `createQuery` cho dashboard stats + recent orders, `Card` cho stats, `Badge` cho status, `Skeleton` loading                          |
| [admin/menu](src/routes/admin/menu/+page.svelte)               | `createQuery` cho menu items, `Card` items, `Input` search, `Select` filter, `Button`. Grid layout giu nguyen (khong can Data Table) |
| [admin/orders/[id]](src/routes/admin/orders/[id]/+page.svelte) | `createQuery` cho order detail, `Card`, `Select`, `Badge`, `Button`                                                                  |
| [admin/settings](src/routes/admin/settings/+page.svelte)       | `Card`+`Input`+`Label`+`Button` (khong can Query -- form submit)                                                                     |
| [admin/statistics](src/routes/admin/statistics/+page.svelte)   | `createQuery` cho stats data, `Chart` (BarChart), `Card`, `Select`, `Tabs`, `Button`                                                 |


### 3.4 Trang Statistics - Chart chi tiet

**"Doanh thu theo thang"** (hien tai la table + progress bar):

- Chuyen sang **Bar Chart** voi:
  - Truc X: Thang (1-12)
  - Truc Y: Doanh thu (VND)
  - Tooltip hien thi: So don + Doanh thu (formatted)
  - Mau: orange brand color

```svelte
<Chart.Container config={revenueConfig} class="min-h-[300px] w-full">
  <BarChart
    data={stats.revenue.monthly}
    xScale={scaleBand().padding(0.25)}
    x="month"
    axis="both"
    series={[{ key: "total", label: "Doanh thu", color: "var(--primary)" }]}
    props={{ xAxis: { format: (d) => `T${d}` } }}
  >
    {#snippet tooltip()}
      <Chart.Tooltip />
    {/snippet}
  </BarChart>
</Chart.Container>
```

**"So luong theo khu vuc"** (hien tai la table):

- Chuyen sang **Horizontal Bar Chart** voi:
  - Truc Y: Ten quan/huyen hoac phuong/xa
  - Truc X: So don hang
  - Tooltip hien thi: So don + Doanh thu
  - Giu `Tabs` de chuyen giua Quan/Huyen va Phuong/Xa

### 3.5 Public components (17 files)


| Component                                                               | Thay doi                                                                               |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [Header.svelte](src/lib/components/Header.svelte)                       | `Button` cho cart, giu layout custom                                                   |
| [Footer.svelte](src/lib/components/Footer.svelte)                       | `Separator` thay border-t                                                              |
| [BottomNav.svelte](src/lib/components/BottomNav.svelte)                 | Giu layout, dung `Button variant="ghost"`                                              |
| [CartButton.svelte](src/lib/components/CartButton.svelte)               | `Button variant="outline"` + `Badge` cho count                                         |
| [Cart.svelte](src/lib/components/Cart.svelte)                           | `Sheet side="bottom"` (mobile) / `Sheet side="right"` (desktop), `Button`, `Separator` |
| [MenuDrawer.svelte](src/lib/components/MenuDrawer.svelte)               | `Sheet side="bottom"`, `Button`, `Badge` cho gia                                       |
| [BottomSheet.svelte](src/lib/components/BottomSheet.svelte)             | `Sheet side="bottom"` (generic wrapper)                                                |
| [MenuItem.svelte](src/lib/components/MenuItem.svelte)                   | `Card`, `Button`                                                                       |
| [MenuDetail.svelte](src/lib/components/MenuDetail.svelte)               | `Card`                                                                                 |
| [MenuFilter.svelte](src/lib/components/MenuFilter.svelte)               | `Card`, `Select`                                                                       |
| [MenuBook.svelte](src/lib/components/MenuBook.svelte)                   | Giu animation custom, chi doi Button                                                   |
| [MediaGallery.svelte](src/lib/components/MediaGallery.svelte)           | Giu logic, giu CSS custom                                                              |
| [OrderForm.svelte](src/lib/components/OrderForm.svelte)                 | `Input`/`Select`/`Label`/`RadioGroup`/`Button`                                         |
| [OrderConfirmModal.svelte](src/lib/components/OrderConfirmModal.svelte) | `Dialog`, `Card`, `Separator`, `Button`                                                |
| [OrderHistory.svelte](src/lib/components/OrderHistory.svelte)           | `Card`, `Badge` cho status                                                             |
| [FloatingContact.svelte](src/lib/components/FloatingContact.svelte)     | `Button` voi rounded-full, giu animation                                               |
| [ReviewForm.svelte](src/lib/components/ReviewForm.svelte)               | `Card`, `Textarea`, `Button`, `Label`                                                  |


### 3.6 Public pages (5 files)


| Page                                                            | Thay doi                                |
| --------------------------------------------------------------- | --------------------------------------- |
| [+page.svelte](src/routes/+page.svelte) (Home)                  | `Button`, `Card`                        |
| [menu/+page.svelte](src/routes/menu/+page.svelte)               | Components da duoc refactor             |
| [menu/[slug]/+page.svelte](src/routes/menu/[slug]/+page.svelte) | `Button`, `RadioGroup`, `Card`, `Badge` |
| [cart/+page.svelte](src/routes/cart/+page.svelte)               | `Button`, `Card`, `Skeleton`            |
| [orders/+page.svelte](src/routes/orders/+page.svelte)           | Components da duoc refactor             |


### 3.7 Don dep

- `app.css` da duoc rewrite tu Phase 1.2 (xoa global styles, chuyen sang shadcn theme)
- Kiem tra khong con reference nao den `.btn-primary`, `.btn-secondary`, `.card-surface` trong codebase
- Kiem tra khong con `--color-primary`, `--color-surface` (CSS variables cu) duoc dung o dau
- Giu `.container-shell` (utility layout huu ich)
- Giu custom CSS cho `MenuBook` flip animation, `reveal-fade-up`, view transitions
- Kiem tra responsive tren mobile/desktop sau khi migrate

## Thu tu thuc hien khuyen nghi

1. **Setup + Rewrite app.css** (Phase 1) - QUAN TRONG NHAT, lam dau tien de tranh xung dot global styles
2. **Admin pages truoc** - it user-facing hon, de test
3. **Statistics page voi Charts** - feature moi nhat
4. **Public components** - can than vi la customer-facing
5. **Don dep** - verify khong con code cu

