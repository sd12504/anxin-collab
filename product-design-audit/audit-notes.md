# Product Design Audit - anxin-collab

Date: 2026-06-24
Target: http://127.0.0.1:5173/
Build: `npm.cmd run build` passed.

## Scope

Reviewed the revised local app against the requested warm interior-design dashboard direction. Checked routes:

1. `/` dashboard
2. `/cases`
3. `/collab`
4. `/library`
5. `/export`
6. `/brand`
7. `/settings`

Desktop viewport tested at 1440x900. Mobile viewport tested at 390x844 for `/`, `/export`, `/settings`.

Browser screenshot capture timed out in the in-app browser, so this audit is based on live DOM, console, responsive layout metrics, source inspection, and visible browser state. No new console errors were observed.

## Findings

### P1 - Mobile sidebar is always mounted off-canvas and can cause the horizontal "jump" feeling

Evidence:
- `src/components/Layout.tsx:30-35`
- At mobile viewport, the sidebar exists as `position: fixed`, width 224, `left: -224`, `right: 0`.
- Body reports no horizontal scroll, but the fixed off-canvas element is still present and transition-enabled.

Risk:
- On first paint, route changes, or breakpoint changes around `lg`, the sidebar can visibly animate or recompose from the left. This matches the reported "some pages suddenly move right" behavior.

Recommendation:
- For closed mobile sidebar, prefer `transform: translateX(-100%)` with `will-change: transform`, `pointer-events: none`, and no layout-affecting `left` movement.
- Add `overflow-x-hidden` to the app shell/body.
- Avoid `transition-transform` on the desktop `lg:sticky` state, or explicitly use `lg:transition-none`.

### P1 - Brand NavLink is active on the dashboard, so the active nav state is wrong

Evidence:
- `src/components/Layout.tsx:37`
- The brand uses `<NavLink to="/">` without `end`.
- On `/`, DOM reports the active nav as the brand link text, not the actual "總覽" nav item.

Risk:
- Users get an ambiguous active state. It also makes automated checks and accessibility state misleading.

Recommendation:
- Change the brand link from `NavLink` to a plain `Link`, or add `end` and remove active styling concerns.
- Keep the real dashboard nav item as the only active route indicator.

### P2 - Route transition uses Framer opacity/y only, but DeepSeek removed the GSAP animation polish

Evidence:
- `src/components/Layout.tsx:102-112`
- `gsap` and `@gsap/react` are no longer used in `Layout.tsx`.

Risk:
- Current transition is simple and build-safe, but it no longer follows the GSAP animation direction requested earlier.
- If the rightward jump persists, the sidebar transition is now the main suspect rather than page content animation.

Recommendation:
- Either keep Framer and remove GSAP from dependencies, or restore scoped GSAP animation intentionally.
- For now, fix the sidebar transition first before adding more motion.

### P2 - Several pages have no real visual assets despite the reference image being asset-heavy

Evidence:
- DOM image count is `0` across reviewed routes.
- `/library` uses placeholder icon/text cards instead of visible thumbnails.

Risk:
- The reference direction relies heavily on warm interior thumbnails. Without images, the redesign reads more like a styled admin mock than the intended visual production board.

Recommendation:
- Use existing frame images from the earlier project assets where available.
- Asset cards should display real thumbnails with `object-cover`, stable aspect ratio, and fallback only when no image exists.

### P2 - Dashboard lacks a visible page heading

Evidence:
- At `/`, heading list is empty.
- The reference dashboard has a clear "總覽" title.

Risk:
- Screen reader and visual hierarchy are weaker on the landing dashboard.

Recommendation:
- Add an `h1` or `h2` "總覽" at the top of `Dashboard.tsx`.

### P3 - Mobile top bar and sidebar both contain brand controls

Evidence:
- Mobile DOM contains hidden/off-canvas sidebar plus fixed top bar.

Risk:
- This is acceptable structurally, but without careful focus management users can tab into off-canvas nav controls.

Recommendation:
- When menu is closed, set sidebar `aria-hidden`, disable pointer events, and prevent keyboard focus into hidden nav.

## Route Health

1. Dashboard `/` - Mostly healthy visually, but active nav and missing heading need fixing.
2. Cases `/cases` - Healthy; table present, filters/buttons present, no overflow.
3. Collab `/collab` - Healthy but dense; content works and no overflow detected.
4. Library `/library` - Functional but visually under-delivers because assets are placeholders.
5. Export `/export` - Healthy; content is dense but no overflow or console errors.
6. Brand `/brand` - Healthy; simple settings page works.
7. Settings `/settings` - Healthy; no console errors or overflow.

## Suggested DeepSeek Fix Order

1. Fix sidebar off-canvas behavior and add `overflow-x-hidden`.
2. Change brand `NavLink` to `Link` so active nav is correct.
3. Add dashboard heading.
4. Add real thumbnails to Asset Library and relevant cards.
5. Re-test `/`, `/export`, `/settings` at 390px and all routes at 1440px.
