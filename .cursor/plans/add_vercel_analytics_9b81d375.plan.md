---
name: Add Vercel analytics
overview: Integrate Vercel Analytics and Speed Insights, then run a deep performance + SEO optimization pass for all public routes with measurable Lighthouse/Core Web Vitals targets.
todos:
  - id: add-vercel-packages
    content: Install @vercel/analytics and @vercel/speed-insights dependencies
    status: completed
  - id: wire-root-layout
    content: Initialize Analytics and Speed Insights in src/routes/+layout.svelte without altering existing UI logic
    status: completed
  - id: seo-foundation
    content: Implement SEO foundations for public routes (unique title/description/canonical, OG/Twitter metadata, robots.txt, sitemap.xml)
    status: completed
  - id: perf-optimization
    content: Perform deep performance optimization on public routes (image/font strategy, JS/CSS delivery, caching, route-level payloads)
    status: completed
  - id: run-validation
    content: Validate with check/build and Lighthouse/Core Web Vitals targets; fix regressions found
    status: completed
isProject: false
---

# Add Vercel Analytics + Deep Performance/SEO

## What I’ll change

- Add Vercel client SDK dependencies to the project:
  - `@vercel/analytics`
  - `@vercel/speed-insights`
- Initialize both integrations in the root SvelteKit layout so they run app-wide:
  - `[/Users/loithai/Projects/tiemlauanhhai/src/routes/+layout.svelte](/Users/loithai/Projects/tiemlauanhhai/src/routes/+layout.svelte)`
- Keep existing layout behavior intact (view transitions, head tags, and children render).
- Apply deep speed/performance and SEO improvements across all public routes.

## Implementation approach

- In `[/Users/loithai/Projects/tiemlauanhhai/src/routes/+layout.svelte](/Users/loithai/Projects/tiemlauanhhai/src/routes/+layout.svelte)`:
  - Import `dev` from `$app/environment`.
  - Import the SvelteKit helpers from Vercel SDKs (`injectAnalytics` and `injectSpeedInsights`).
  - Call these once at module init only when not in local development (`dev === false`), so Analytics/Web Vitals are skipped locally.
- Add route-level SEO metadata patterns for public pages (title, description, canonical, OG, Twitter), then ensure crawlability artifacts (`robots.txt`, `sitemap.xml`) are present and correct.
- Optimize performance bottlenecks on public routes by focusing on:
  - render path and JS/CSS delivery,
  - image/font loading strategy,
  - caching and payload sizing,
  - avoid unnecessary client-side work during navigation.
- Iterate with measurement after each optimization pass.

## Verification

- Run project checks/build to confirm no regressions:
  - `npm run check`
  - `npm run build`
- Validate performance and SEO for all public routes with Lighthouse + CWV-focused checks.
- Target outcomes for production pages:
  - Lighthouse Performance >= 90 (mobile baseline),
  - Lighthouse SEO >= 95,
  - no critical crawl/indexing issues.
- Confirm generated app includes Vercel instrumentation endpoints/scripts when deployed on Vercel.

## Notes

- This repo is already configured for Vercel deploy via `@sveltejs/adapter-vercel`, so no adapter changes are needed.
- Feature toggles for Analytics and Speed Insights should also be enabled in the Vercel project dashboard for data to appear.
- Local development should not send telemetry; instrumentation runs only in non-dev environments.

