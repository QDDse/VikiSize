# Design System: VikiSize Quiet Utility

This file is the visual source of truth for Google Stitch and for later WeChat Mini Program implementation. Generate a real mobile product interface, not a presentation board, landing page, dashboard concept, or phone mockup.

## 1. Visual Theme & Atmosphere

VikiSize is a quiet personal utility for two everyday contexts: collaborative travel and fitness review. It should feel like a well-kept field notebook translated into a native WeChat Mini Program: warm, orderly, direct, and trustworthy.

- **Density: 6/10 — Daily App Balanced.** Show enough information to act without making the screen feel sparse or ornamental.
- **Variance: 3/10 — Predictable With Small Offsets.** Use a stable left-aligned reading rhythm. Create character through spacing and type hierarchy, not unusual geometry.
- **Motion: 2/10 — Static Restrained.** Motion confirms an action; it never performs for attention.
- **Primary quality:** practical calm. The interface should communicate “I know what needs attention” within three seconds.
- **Visual metaphor:** a clean paper ledger with one muted forest-green annotation pen.
- **Surface philosophy:** use the page canvas first, dividers second, a subtle surface tint third, borders fourth, and elevation only as a last resort.
- **Hero rule:** this product has no marketing hero. At most one short contextual summary block may appear near the top of a screen. It contains status and a next action, never a slogan or illustration.

## 2. Color Palette & Roles

Use this single warm-neutral palette across travel and fitness. Do not drift between cool blue-gray and warm beige-gray.

- **Canvas Linen** (`#F7F6F2`) — Primary page background and safe-area continuation.
- **Paper Surface** (`#FFFDF9`) — Grouped lists, settings rows, and input surfaces.
- **Quiet Sage** (`#EEF2ED`) — The single contextual summary surface and selected soft states.
- **Pressed Sage** (`#E3EAE5`) — Pressed rows, skeleton blocks, and disabled neutral fills.
- **Charcoal Ink** (`#18231F`) — Primary headings and body text. Never substitute pure black.
- **Muted Moss** (`#6B7771`) — Dates, helper copy, units, and secondary metadata.
- **Whisper Line** (`#DDE3DE`) — One-pixel separators, grouped-list borders, and control outlines.
- **Forest Action** (`#267D69`) — The only accent color. Use for the primary action, active navigation, links, focus, and positive selected states. Its saturation stays below 80%.

Color usage rules:

- Keep at least 80% of each screen neutral.
- Do not use gradients, glow, glass effects, tinted drop shadows, purple, neon blue, or multiple accent colors.
- Never use Forest Action as a large page background. A large dark-green hero is banned.
- Use color to identify action or selection, not to decorate sections.
- Text and controls must meet WCAG AA contrast. Do not communicate unread, selected, warning, or disabled state by color alone; pair color with text, weight, or an icon.
- Error and warning colors may use the host platform's semantic colors only for actual errors or warnings. They are not part of the brand palette and must never become decorative accents.

## 3. Typography Rules

Use a native Chinese reading experience with a controlled Latin/numeric companion.

- **Chinese UI:** `PingFang SC`, then `HarmonyOS Sans SC`, then `Noto Sans SC`.
- **Latin and numerals:** `Geist`, then the Chinese UI stack. Use `Geist Mono` only for dense identifiers or technical timestamps, not ordinary prices and dates.
- **Page title:** 30px, weight 700, line-height 1.15, letter-spacing -0.02em.
- **Context title:** 23px, weight 650–700, line-height 1.28, letter-spacing -0.015em.
- **Section title:** 20px, weight 650–700, line-height 1.3.
- **Row title:** 16px, weight 600, line-height 1.4.
- **Body:** 15px, weight 400–500, line-height 1.55, maximum 65 characters per line.
- **Metadata:** 13px, weight 400–500, line-height 1.45, Muted Moss.
- **Action label:** 15px, weight 600, Forest Action.
- **Numbers:** use tabular figures. Emphasize only the number, not the entire sentence.

Typography constraints:

- Hierarchy comes from weight, tone, and spacing before size.
- Do not exceed 30px for a normal page title or 24px for an in-page status title.
- Do not use all caps, artificial tracking, outlined text, gradient text, or decorative serif type.
- `Inter`, Times New Roman, Georgia, Garamond, Palatino, and generic display serifs are banned.
- Do not center long Chinese text. Product copy is left aligned.
- Do not use extra-bold weight for metadata, tabs, badges, or helper text.

## 4. Component Stylings

### App Header

- A 64px content row below the host safe area.
- Left: one page title. Right: one text action such as `成员` or `接入数据`.
- Header actions use a 44px minimum tap target, 15px label, and optional 20px line icon.
- Do not render a header action as an outlined input, long capsule, or default browser button.
- Never duplicate a native WeChat navigation title inside the page. Stitch outputs app content only and omits OS and WeChat chrome.

### Context Summary

- Maximum one per screen.
- Quiet Sage fill, Whisper Line 1px border, 16px radius, 20px padding, no shadow.
- Content order: small time/status label, concise title, one metadata line, then at most one quiet text action.
- No illustration, decorative orbit, texture, photo, statistic cloud, or promotional paragraph.
- The block should normally stay between 136px and 176px tall.

### Primary Action

- Maximum one visually strong action per viewport.
- 44px minimum height, 10px radius, Forest Action fill, Paper Surface label.
- Use a compact label that starts with a verb: `去确认`, `导入`, `保存`.
- Active state: opacity 0.86 and scale 0.98. Never use glow, sweep, pulse, or a giant circular icon.
- Secondary actions are text links or normal list rows, not additional filled buttons.

### Text Actions

- Forest Action text with a 44px touch target.
- A small 16px chevron may clarify navigation. Do not combine an arrow circle, a filled button, and a chevron for the same action.
- Underlines are reserved for inline links inside copy, not section actions.

### Grouped Lists

- Use one Paper Surface container per logical list, 14px radius, Whisper Line 1px border, no shadow.
- Rows are 68–84px tall with 16px horizontal padding.
- Separate rows with an inset one-pixel divider. Do not make every row its own card.
- Row structure: optional 20px icon or compact day marker, one flexible text column, optional status/action, then one chevron.
- Row press state uses Pressed Sage without changing layout.

### Inline Status Ledger

- Three facts may appear on one flat row only when they are genuinely comparable, such as `周报 6 份 / 待确认 0 项 / 体测 1 份`.
- This is a single ledger with narrow vertical dividers, not three equal cards.
- Use 15px labels and tabular accent-colored numbers. No giant KPI typography.

### Cards and Elevation

- Cards are exceptional. A border and grouping should solve almost every separation need.
- Never nest cards.
- Default shadow is none. A transient overlay may use `0 8px 24px rgba(24, 35, 31, 0.08)` only when elevation conveys actual layering.
- Default radius is 14px. Summary surfaces may use 16px. Do not use 24–40px radii or `999px` pills for ordinary controls.

### Status Labels and Roles

- Prefer plain text such as `未读`, `已读`, or `管理员`.
- If containment is necessary, use a 6px radius, 11–12px text, and Quiet Sage fill.
- Pills are reserved for binary filters or a compact status that cannot be understood without containment.

### Inputs and Forms

- Label above the field, helper copy below, error below helper copy.
- 44–48px field height, 10px radius, Paper Surface fill, Whisper Line border.
- Focus uses a 2px Forest Action ring without glow.
- Never use a placeholder as the only label. Never style a navigation action to look like an input.

### Toggle

- Use the native switch silhouette, 48×28px, Forest Action when on and Pressed Sage when off.
- Keep its row tappable and include a plain-language label and schedule/state text.

### Icons

- Use one consistent system-style line icon family at 18–20px with approximately 1.75px stroke.
- Icons support labels; they do not replace important Chinese text.
- No emoji, ASCII icons, handmade geometric illustrations, decorative mascots, or oversized icon circles.

### Bottom Navigation

- Exactly two current product destinations: `旅行` and `健身`.
- 64px visual height plus host safe-area inset, Paper Surface background, Whisper Line top divider.
- Icons are 20–22px; labels are 13px. Selected state uses Forest Action; unselected state uses Muted Moss.
- Content must include bottom padding equal to the navigation height so the bar never obscures a list.

### Loading, Empty, Error, and Disabled States

- Loading uses skeleton blocks that match the final row geometry. A subtle opacity shimmer is allowed; circular spinners are not the default.
- Empty states explain what belongs here and offer one concrete next step. Use text and an optional real icon, not an ornamental illustration.
- Errors appear inline near the affected content, state what failed, and offer one recovery action.
- Disabled controls retain readable contrast and explain the prerequisite when it is not obvious.

## 5. Layout Principles

### Mobile Canvas

- Primary Stitch frame: 390×844px.
- Render app content only: no phone shell, OS status bar, WeChat menu capsule, battery, signal, home indicator, rounded device mask, or device shadow.
- Use 20px side gutters; reduce to 16px below 360px viewport width.
- Use an 8px spacing rhythm. Allowed common gaps: 4, 8, 12, 16, 20, 24, and 32px.
- Keep section gaps at 28–32px and related-row gaps at 8–12px.
- All touch targets are at least 44×44px.
- No horizontal scrolling on a primary screen. Report archives and itinerary days use vertical grouped lists.
- No overlapping elements or absolute-positioned decorative layers. Every element occupies a clear spatial zone.
- In a web preview, use `min-height: 100dvh`, never `h-screen`. In the mini program, respect top and bottom safe areas.
- For implementation at a 750rpx design width, translate design pixels consistently at approximately 1px to 2rpx and preserve the visual proportions rather than literal fractional values.

### Responsive Behavior

- This is a mobile-first product; it remains a single reading column at all widths.
- Above 430px, keep the content column at a maximum of 430px on the same Canvas Linen background. Do not place it inside a fake phone or centered app card.
- Text may wrap naturally; controls never shrink below their touch targets.
- Do not create desktop sidebars, multi-column dashboards, or alternate desktop navigation for this mini-program source of truth.

### Travel Home Blueprint

Use this exact information order:

1. Header: `旅行` with right action `成员`.
2. Context summary: relative departure label, trip name, date range, and quiet role text.
3. One next-action row: `下一步`, action title, route metadata, and one `去确认` action.
4. One inline ledger for task count and budget; it may use two balanced facts, not separate cards.
5. `行程` section with `查看全部` and one grouped list of itinerary days.
6. Bottom navigation with `旅行` selected.

For the current sample state, use realistic copy such as:

- `距离出发 34 天`
- `关东东京 8 天旅行小队`
- `9月24日–10月1日`
- `确认第一天交通`
- `成田/羽田 → 新宿`
- `D1 · 9月24日 周四 · 抵达东京 · 新宿夜景轻量适应`

Date-state rule: before a trip, describe preparation; during a trip, surface the current and next stop; after a trip, surface review/archive. Never label a future trip as `今日执行`.

### Fitness Home Blueprint

Use this exact information order:

1. Header: `健身`, subtitle `训练回顾`, and right action `接入数据`.
2. Context summary: current week, confirmation status, archive count, and one quiet `查看训练记录` action.
3. One inline ledger for weekly reports, pending confirmations, and body measurements.
4. `最近体测` section with one grouped row and the single strong `导入` action.
5. `提醒` section with one native settings row and a toggle.
6. `周报归档` section with unread count and a vertical grouped list.
7. Bottom navigation with `健身` selected.

For the current sample state, use realistic copy such as:

- `本周回顾 · 8月17日–23日`
- `本周无需处理`
- `6 份周报已归档，暂无待确认项目`
- `8月18日体测记录`
- `下一个周报提醒 · 周日 20:00`
- `本周训练周报 · 未读`

Fitness trust rule: plan changes are never presented as automatic. Use confirmation language and preserve the distinction between imported evidence, a proposed change, and a confirmed writeback.

## 6. Motion & Interaction

Motion must be nearly invisible and hardware accelerated.

- **Press feedback:** 120–160ms, transform scale 0.98 plus opacity 0.86, using `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- **Toggle or sheet motion:** if a spring engine exists, use stiffness 100 and damping 20. Otherwise use the same restrained cubic-bezier curve.
- **Screen entry:** optional 4px translateY plus opacity over 160ms. Do not animate more than the first logical group.
- **List reveal:** mount immediately. If Stitch needs staged motion, use no more than 30ms between the first three rows and stop there.
- **Loading:** a low-contrast skeleton opacity shimmer may loop. No other perpetual loop is permitted.
- Animate only `transform` and `opacity`. Never animate top, left, width, height, border radius, or large background gradients.
- Respect reduced-motion settings by removing translation and leaving only instant state changes or a short opacity transition.
- There is no marquee, floating ornament, pulsing badge, bouncing arrow, typewriter copy, orbit animation, or decorative parallax.

## 7. Anti-Patterns (Banned)

Stitch must never generate any of the following:

- No AI-style dark hero, gradient hero, orbit diagram, abstract blob, glow, glassmorphism, or decorative line art.
- No marketing slogans such as `让训练按身体节奏前进`, `Elevate`, `Seamless`, `Unleash`, `Next-Gen`, or `重新定义`.
- No giant headline, huge number, or promotional paragraph above the user's current task.
- No card soup, cards inside cards, bento dashboard, three equal metric cards, or a separate card for every list row.
- No oversized pills, default 999px radii, thick shadows, floating action bars, or redundant CTA combinations.
- No pure black, neon colors, purple/blue glow, oversaturated accent, gradient text, or multiple competing greens.
- No `Inter`, generic serif fonts, emojis, custom cursors, or novelty display type.
- No centered hero, centered long-form copy, overlapping elements, clipped text, or absolute-positioned content stacking.
- No horizontal report carousel, clipped ticker, marquee, or hidden off-screen primary content.
- No fake phone frame, OS status bar, WeChat chrome, battery indicators, or screenshot presentation furniture.
- No duplicated page title, duplicated action, or header button styled as a long outlined input.
- No generic placeholder identities such as `John Doe`, `Acme`, or `Nexus`; use actual product data or clearly contextual Chinese examples.
- No fake round performance claims such as `99.99%` or arbitrary progress rings.
- No filler prompts such as `Scroll to explore`, `Swipe down`, bouncing chevrons, or decorative onboarding copy.
- No fabricated AI coach, recommendation, score, insight, or automatic plan mutation.
- No unverified status language. Local data, imported evidence, pending confirmation, and completed writeback must look and read differently.

## Stitch Generation Contract

When this file is provided to Google Stitch:

1. Generate one screen per image, at 390×844px.
2. Use Chinese production copy and realistic dates/counts.
3. Preserve the screen blueprints and component hierarchy above.
4. Generate app content only, with no device or platform chrome.
5. Keep one accent color and one primary action per screen.
6. Prefer fewer containers. If a section still reads clearly after removing a card, remove the card.
7. Before accepting a screen, check for clipped content, accidental horizontal overflow, inconsistent radii, weak contrast, duplicate controls, and any banned AI tell.
