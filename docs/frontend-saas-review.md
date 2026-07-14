# Tijoir Frontend — Expert SaaS Review (layout, components, shadcn)

_Scope: everything EXCEPT color and fonts (those are fine). Focus: structure, component quality, placement conventions, and adopting shadcn/ui + lucide icons so the product reads as a real B2B SaaS instead of a hand-rolled admin panel._

Benchmarks used: Stripe Dashboard, Linear, Vercel, Clerk, and the official shadcn/ui dashboard + sidebar blocks. See Sources at the end.

---

## 1. Verdict

The app is functionally complete but visually reads as "mediocre / generic admin" for five concrete reasons, none of which are color/font:

1. **Zero icons.** Nav is text-only; menus use a unicode `▾`; the mobile toggle is a literal word "Menu". Real SaaS is icon + label everywhere.
2. **Navigation is split and duplicated.** Primary nav lives in the sidebar, but Organization / Settings ("Policy") / Audit *also* live inside a top-right account menu — and "Organization" appears in both. Users can't build a mental model.
3. **No identity system.** No avatars. No org switcher. No user block. Role, name, email, and a "Verified" badge are crammed into a bordered pill in the topbar — loud and redundant.
4. **Primitives are shallow.** The table has no sorting, no row actions, no selection; notifications are a plain "Inbox" button routing to a page; every action throws a full-screen `BusyOverlay`; dialogs use a text "Close" instead of an X.
5. **Inconsistent geometry.** Border-radius drifts across components (`rounded-xl`, `rounded-2xl`, `rounded-3xl` all in use). This is the single biggest "unpolished" tell after the missing icons.

Fix = adopt shadcn/ui primitives + lucide icons, unify one layout shell, and put identity/settings/notifications where users expect them.

---

## 2. Where things must live (the SaaS convention)

Current placement is wrong or missing. Target below, grounded in Stripe/Linear/Vercel/shadcn.

```
┌────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR (collapsible, icon+label)     │   TOPBAR (thin, 56px)           │
│                                        │                                 │
│  ┌── Org switcher ──────────────┐      │  [☰ mobile]  Vault ▸ Secrets    │  ← breadcrumb/title (left)
│  │ (TJ)  Tijoir Inc.     ▾      │      │            [ ⌘K search ]        │  ← optional global search (center)
│  └──────────────────────────────┘      │        [+ Create ▾] [🔔•] [(SP)▾]│  ← actions (right)
│                                        │                                 │
│  ▸ overview     (icon) Overview        │─────────────────────────────────│
│  ▸ vault        (icon) Vault           │                                 │
│  ▸ share        (icon) Share Links     │   PAGE CONTENT                  │
│  ▸ vendors      (icon) Vendors         │                                 │
│  ── Team ──                            │                                 │
│  ▸ members      (icon) Members         │                                 │
│  ▸ audit        (icon) Audit Log       │                                 │
│                                        │                                 │
│  ┌── User block (bottom) ───────┐      │                                 │
│  │ (SP) Shashank P.             │      │                                 │
│  │      ORG_OWNER          ▾    │      │                                 │
│  └──────────────────────────────┘      │                                 │
└────────────────────────────────────────────────────────────────────────┘
```

- **Org identity → top of sidebar.** Circular avatar with **org initials** (e.g. "TJ" from "Tijoir Inc.") + org name + a chevron. The chevron opens a menu: *Organization settings*, *Members*, *Switch organization* (future), *Billing* (future). This is the org switcher pattern from Vercel/Linear/Clerk.
- **User identity → bottom of the sidebar** (single source of truth — do NOT also put it top-right). Circular avatar with **user initials** + full name + **role as the small subtitle** (`ORG_OWNER`). Click opens an upward menu: *Account* (name, email, password), *Settings*, *Theme* (later), *Log out*.
- **Role** belongs in that user block subtitle and on the Members table — not as a loud topbar badge.
- **Settings**: one route `/dashboard/settings`, reached from the user menu, split into **Account** (personal) and **Organization** (policy, access model). Stop calling it "Policy."
- **Notifications → a bell icon with an unread-count dot** in the topbar. Clicking opens a **popover** with the latest ~5 items, "Mark all read", and "View all" → the notifications page. Replace the current "Inbox" text button.
- **Create → a primary "+ Create" split-button/menu** top-right. Items should **open the create dialog in place**, not route to a page and hope the user finds the button.
- **Email-verified state**: not a permanent topbar badge. Show a dismissible banner **only while unverified**; hide entirely once verified.

---

## 3. Component-by-component findings (every minute detail)

Legend: 🔴 must-fix · 🟡 should-fix · 🟢 polish

### Layout shell — `components/dashboard/dashboard-shell.tsx`
- 🔴 Sidebar nav items are text-only. Add a lucide icon per item (`LayoutDashboard`, `KeyRound`, `Share2`, `Building2`, `Users`, `ScrollText`, `Settings`). Icon + label, 14px label, 16px icon.
- 🔴 No active-state affordance beyond a faint bg. Add a left accent bar or a filled pill + icon color change on the active route.
- 🔴 Sidebar has no user block and no org switcher (see §2). Add both.
- 🟡 Sidebar isn't collapsible on desktop. Add a collapse-to-icons toggle (shadcn sidebar supports this) — power users expect it.
- 🟡 Nav has no grouping. Add a "Team" group separator before Members/Audit.
- 🟡 Mobile menu button is the word "Menu" — replace with a hamburger icon (`Menu` from lucide) and use a shadcn `Sheet` for the mobile drawer.
- 🟢 Logo tile "Tj" is a rounded square; make the org avatar a **circle** to match the identity system.
- 🟢 Geometry: shell uses `rounded-xl`; other components use `2xl`/`3xl`. Pick one scale (recommend `xl` for controls, `2xl` for cards) and apply everywhere.

### Topbar — `components/dashboard/dashboard-workspace-topbar.tsx`
- 🔴 `DashboardWorkspaceUserMeta` pill (role + verified + name·email) is redundant with the account menu and visually heavy. Remove it; identity moves to the sidebar user block.
- 🔴 `▾` unicode glyph in both menus → use lucide `ChevronDown`.
- 🔴 "Inbox" button → bell icon (`Bell`) + unread dot, opens a notifications popover (not a route).
- 🔴 Account menu shows text-only org+user → replace trigger with a circular **Avatar** (initials) + name; but per §2 prefer moving this to the sidebar and keeping the topbar-right for Create + bell only.
- 🟡 "Policy" label is wrong → "Settings". "Organization" appears here and in sidebar → keep it in one place.
- 🟡 "Create" menu items route to pages → they should open the relevant create dialog directly.

### Data table — `components/ui/data-table.tsx`
- 🔴 No column sorting. Adopt **TanStack Table + shadcn DataTable** for sortable headers.
- 🔴 No per-row actions. Add a trailing actions column with a `…` (`MoreHorizontal`) dropdown (Reveal / Rotate / Revoke, etc.) instead of relying on row-click + a side panel.
- 🟡 No row selection / bulk actions (checkbox column) — needed for revoke-many, later.
- 🟡 Row-click selection has weak affordance; add a hover state + a trailing chevron or explicit "View".
- 🟢 No density option, no zebra striping, no empty-cell placeholder (`—`).
- 🟢 Header uses inline `style={{backgroundColor}}` — move to a class.

### Table controls — `components/ui/table-controls.tsx`
- 🔴 `SearchInput` has no search icon and no clear (×) button. Add leading `Search` icon + clearable.
- 🟡 `FilterSelect` is a native `<select>` — inconsistent with the rest; use shadcn `Select` for a styled, searchable control.
- 🟡 `PaginationControls` is Prev/Next only. Add page-size selector + "1–12 of 240" range (shadcn table pagination pattern).

### Dialogs — `components/ui/dialog.tsx`
- 🔴 "Close" is a text button; use an **X icon** (`X`) top-right (shadcn Dialog default).
- 🟡 No dedicated footer region — actions are ad-hoc inside children. Add a `DialogFooter` slot so every dialog aligns actions consistently (right-aligned, primary last).
- 🟡 `ConfirmDialog` for destructive actions should use shadcn **AlertDialog** semantics (role, focus trap on confirm) — you're deleting/revoking secrets.
- 🟢 Adopt shadcn Dialog outright (Radix) for focus trapping + a11y you currently hand-roll.

### Feedback / toasts — `components/ui/feedback.tsx` + `toast-provider.tsx`
- 🔴 `BusyOverlay` throws a **full-screen modal spinner for every action** (create secret, revoke…). This is the most "not-SaaS" interaction. Replace with: inline button loading state (spinner in the button) + optimistic update + a **sonner toast** on completion.
- 🟡 Replace the custom toast provider with **sonner** (shadcn's toast) — richer, stacked, action buttons, promise toasts.
- 🟢 Empty states (`EmptyState`) are text-only. Add a muted icon + a primary CTA button inside ("Create the first secret").
- 🟢 Geometry: `SectionCard` is `rounded-3xl`, `InlineMessage`/`BusyOverlay` `2xl`/`3xl` — unify.

### Menus — `components/ui/menu.tsx`
- 🟡 Custom dropdown works but lacks keyboard arrow navigation, icons, section labels, and destructive styling. Replace with shadcn **DropdownMenu** (Radix) — you get all of it free and consistent with the table row menu.

### Notifications
- 🔴 Currently a full page reached via an "Inbox" button. Add a topbar **bell + popover** (recent items, unread dot, mark-all-read, view-all). Keep the page as the "view all" target.
- 🟢 "Push notifications" for a web SaaS = (a) sonner toasts for in-session events, (b) the bell popover for async events, (c) optional browser Web Push later. Wire (a) and (b) now.

### Cross-cutting
- 🟡 **No breadcrumbs.** Add a breadcrumb or section title in the topbar-left (shadcn `Breadcrumb`).
- 🟢 **No command palette (⌘K).** Linear/Vercel-grade nicety — shadcn `Command`. Nice-to-have, later.
- 🟢 **Avatars everywhere**: members table, audit "actor", created-by fields should show a small circular initial avatar, not plain text.
- 🟢 **Tooltips** on icon-only controls (shadcn `Tooltip`).

---

## 4. shadcn/ui adoption plan

You already intend to use shadcn — do it as the primitive layer and keep your existing color tokens (shadcn themes via CSS variables, so **your palette stays**). Install and migrate in this order:

1. Base + tokens: `npx shadcn@latest init` (map its CSS vars to your existing color variables so nothing changes visually).
2. Icons: `npm i lucide-react`.
3. Shell: **sidebar** block + `sheet` (mobile) + `separator` + `scroll-area`.
4. Identity: `avatar` + `dropdown-menu`.
5. Data: TanStack `@tanstack/react-table` + shadcn `table` → real DataTable; `select`, `input`, `badge`, `tabs`, `tooltip`, `skeleton`.
6. Overlays: `dialog` + `alert-dialog` + `popover`.
7. Feedback: **sonner** (replace custom toasts) — remove `BusyOverlay`.
8. Later: `command` (⌘K), `breadcrumb`.

Migration principle: swap primitives underneath your existing feature views one component at a time; keep the view prop contracts stable (same as the Phase-1 refactor). No color/font change — only structure and interaction.

---

## 5. Prioritized fix list

**P0 — makes it look like SaaS (do first):**
1. Icons everywhere (lucide) — sidebar, menus, buttons, empty states.
2. Identity system — org switcher (top) + user block (bottom), circular initial avatars; remove the topbar identity pill.
3. Kill `BusyOverlay`; use button-inline loading + sonner toasts.
4. Bell + notifications popover; rename "Policy" → "Settings"; de-duplicate nav.
5. Unify border-radius scale.

**P1 — makes it feel like SaaS:**
6. TanStack + shadcn DataTable: sortable headers + row `…` action menu.
7. shadcn Dialog/AlertDialog (X close, footer, focus trap) + DropdownMenu.
8. Search input with icon + clear; shadcn Select filters; richer pagination.
9. Breadcrumb/title in topbar-left; collapsible sidebar.

**P2 — polish:**
10. Empty-state icon + CTA; avatars in tables; tooltips; ⌘K command palette.

---

## Sources

- [10 Essential Dashboard Design Best Practices for SaaS in 2025 — context.dev](https://www.context.dev/blog/dashboard-design-best-practices)
- [Design thoughtful dashboards for B2B SaaS — UX Collective](https://uxdesign.cc/design-thoughtful-dashboards-for-b2b-saas-ff484385960d)
- [35 SaaS Dashboard Design Examples, Trends and Patterns (2026) — 925studios](https://www.925studios.co/blog/saas-dashboard-design-examples-2026)
- [shadcn/ui — Components](https://ui.shadcn.com/docs/components)
- [shadcn/ui — Sidebar](https://ui.shadcn.com/docs/components/radix/sidebar)
- [shadcn/ui — Dashboard Blocks](https://ui.shadcn.com/blocks)
- [shadcn/ui — Sonner (toasts)](https://ui.shadcn.com/docs/components/radix/sonner)
- [shadcn/ui — Dropdown Menu](https://ui.shadcn.com/docs/components/radix/dropdown-menu)
