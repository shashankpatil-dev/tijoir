# PROMPT — Tijoir Frontend SaaS Upgrade (shadcn + layout + components)

> Paste this whole file as the task. Self-contained: goal, constraints, shadcn setup, exact per-component migration, target layout, and verification. Do the work in the numbered order. Run `npm run build` after each Part. Do NOT change colors or fonts.

---

## 0. Role & Goal

You are an expert frontend engineer making the **Tijoir** dashboard (`frontend/`, Next.js 15 App Router + React 19 + TanStack Query + Tailwind, static export) look and feel like a real B2B SaaS (benchmark: Stripe / Linear / Vercel / Clerk). Today it reads as a hand-rolled admin panel: no icons, split/duplicated navigation, no identity system, shallow primitives (no sortable table, full-screen busy overlay, text "Close" buttons), and inconsistent border-radius.

You will adopt **shadcn/ui + lucide-react** as the primitive layer, rebuild the app shell (sidebar + topbar + identity), and upgrade tables, dialogs, menus, toasts, and notifications — **without changing the color palette or typography**, and **without breaking any feature**.

Full rationale and placement conventions: see `docs/frontend-saas-review.md`. This prompt is the executable version of that review.

---

## 1. Hard Constraints

1. **Do not change colors or fonts.** When you run `shadcn init`, map shadcn's CSS variables to the EXISTING tokens in `globals.css` (map, don't replace). After setup, `git diff` on the color/font declarations must be empty in spirit (same values). Verify with a screenshot comparison if possible.
2. **Do not break features.** Every feature view (`features/*/components/*-view.tsx`) keeps the same props/behavior. You are swapping the primitives *underneath*, not rewriting features.
3. **Keep the Phase-1 scope** (see `docs/SCOPE_PHASE1.md`): auth+RBAC, vault, share links, vendors+contracts, members, audit, notifications, settings. No new features beyond the UI/UX upgrade.
4. **Static export must keep working** (`output: "export"`). Use client components; no server-only APIs.
5. **One primitive at a time.** Migrate a component, build, verify, commit. Do not do a big-bang rewrite.
6. Accessibility floor: keyboard focus visible, dialogs trap focus, icon-only buttons have `aria-label`/tooltip, touch targets ≥ 44px.

---

## 2. PART 0 — shadcn/ui + icons setup

1. Install icons: `npm i lucide-react`.
2. `npx shadcn@latest init`. During init:
   - Choose the CSS-variables theme option.
   - **Map, don't overwrite**, colors: point shadcn's `--background`, `--foreground`, `--primary`, `--border`, `--muted`, `--card`, `--ring`, etc. to the project's existing `--color-*` tokens in `globals.css`. Keep the existing tokens as the source of truth. If init rewrites `globals.css`, restore the original palette values and only add the shadcn variable *aliases*.
   - Keep the existing font setup (do not let init swap the font).
3. Confirm `components.json` uses the existing `@/components` alias and Tailwind config path. Do NOT let it reformat `tailwind.config.ts` colors.
4. Add shadcn components now so they're available (CLI): `button badge input select tabs tooltip skeleton avatar dropdown-menu dialog alert-dialog popover sonner separator scroll-area sheet table breadcrumb`. (Command palette `command` later, P2.)
5. Build. Confirm nothing visually changed yet (components added but unused).

> Note: you already have hand-rolled `components/ui/*`. Plan is to replace their internals with shadcn or re-export shadcn under the same names to keep imports stable (see each Part). Prefer keeping the existing file paths/names and swapping internals so feature views don't change imports.

---

## 3. PART A — App shell: sidebar + topbar + identity (P0)

Rebuild `components/dashboard/dashboard-shell.tsx`, `dashboard-workspace-app.tsx`, and `dashboard-workspace-topbar.tsx` around the shadcn **sidebar** block. Target layout (from review §2):

```
SIDEBAR (collapsible, icon+label)          TOPBAR (thin ~56px)
┌ Org switcher: (TJ) Tijoir Inc.  ▾ ┐      [☰ mobile] Breadcrumb/title   … [+ Create ▾] [🔔•] 
│ ▸ Overview   ▸ Vault              │      ───────────────────────────────────────────────
│ ▸ Share Links ▸ Vendors          │      PAGE CONTENT
│ ── Team ──                        │
│ ▸ Members    ▸ Audit Log          │
│                                   │
└ User block (bottom): (SP) Name /  ┘
        ORG_OWNER            ▾
```

### A1. Sidebar
- Use shadcn `Sidebar` (collapsible to icon rail on desktop; `Sheet`-based drawer on mobile — replaces the current hand-rolled mobile logic).
- **Nav = icon + label** via lucide. Map:
  - Overview → `LayoutDashboard`, Vault → `KeyRound`, Share Links → `Share2`, Vendors → `Building2`, Members → `Users`, Audit Log → `ScrollText`, Settings → `Settings`.
- **Active state:** filled pill + colored icon + left accent bar. Use `usePathname()` to mark active.
- **Group** nav: primary (Overview, Vault, Share Links, Vendors) then a `Team` group (Members, Audit Log). Managers/auditors gating stays exactly as `navigationItems` computes today.
- **Org switcher (top):** circular `Avatar` with **org initials** (derive from `session.organization.name`, e.g. "Tijoir Inc." → "TI"), org name, `ChevronsUpDown` icon. `DropdownMenu`: "Organization settings" → `/dashboard/organization`, "Members" → `/dashboard/members`, (disabled placeholders: "Switch organization", "Billing").
- **User block (bottom):** circular `Avatar` with **user initials** (from `session.user.name`), name, and **role as the muted subtitle** (`session.user.role`). `DropdownMenu` opening upward: "Account" → `/dashboard/settings` (account tab), "Settings" → `/dashboard/settings`, `Separator`, "Log out" → `workspace.logout` (destructive styling).

### A2. Topbar (thin)
- **Left:** mobile sidebar trigger (hamburger `Menu` icon, `aria-label="Open menu"`) + a `Breadcrumb` or the page title derived from the route.
- **Right, only these:** a primary **"+ Create"** `DropdownMenu` (see A4), and the **notifications bell** (see Part D). Nothing else — identity now lives in the sidebar.
- **Remove `DashboardWorkspaceUserMeta` entirely** (the role/verified/name·email pill). Its info now lives in the sidebar user block. Email-verification state becomes a dismissible banner (Part E).

### A3. Avatar helper
- Add `components/ui/initials-avatar.tsx`: circular `Avatar` that renders 1–2 uppercase initials from a name/org string with a deterministic muted background (derive from existing tokens; no new colors). Use it in: org switcher, user block, members table, audit "actor", secret "created by".

### A4. Create menu
- Keep the role gates (`canManageSecrets`, etc.). Change behavior: instead of routing to a page, each item should **open the relevant create dialog** on the current page if present, else navigate then open. Simplest correct approach: navigate to the target page with `?create=1`; the target page's workspace hook reads it once and opens its create dialog. (Remove the old intent event-bus approach — it was already deleted; this query-param approach is the replacement.)

### A5. Geometry
- Establish ONE radius scale and apply across the shell: controls/inputs/buttons `rounded-lg` (or `xl`), cards `rounded-2xl`, avatars `rounded-full`. Remove stray `rounded-3xl`. (Radius only — no color/font.)

---

## 4. PART B — Tables (P1)

Replace `components/ui/data-table.tsx` internals with **TanStack Table + shadcn `table`** while keeping the existing `DataTable`/`DataTableColumn` export signature so feature views don't change. Add:
- **Sortable headers** (click to sort; show `ChevronUp`/`ChevronDown`). Opt-in per column via a `sortable?: boolean` on `DataTableColumn`.
- **Row actions column:** a trailing column rendering a `…` (`MoreHorizontal`) `DropdownMenu`. Provide an optional `rowActions?: (row) => MenuItem[]` prop. Migrate vault (Reveal/Rotate/Revoke), share-links (Copy link/Revoke), vendors (View/Offboard), members (Change role/Deactivate) to use it. Keep the existing side-panel too if useful, but the row `…` menu is the primary action affordance.
- **Empty cell** placeholder `—` for null values.
- Keep row-click selection where a detail panel exists; add clearer hover + a trailing `ChevronRight` when clickable.
- Move the header inline `style={{backgroundColor}}` to a class.
- Later (optional): checkbox selection column + bulk action bar.

Upgrade `components/ui/table-controls.tsx`:
- `SearchInput`: leading `Search` icon + a clear (`X`) button when non-empty.
- `FilterSelect`: replace native `<select>` with shadcn `Select`.
- `PaginationControls`: add a page-size `Select` (12/24/48) and a "1–12 of 240" range label alongside Prev/Next.

---

## 5. PART C — Dialogs & menus (P1)

- Replace `components/ui/dialog.tsx` internals with shadcn `Dialog`:
  - **X icon** (`X`) top-right instead of the text "Close".
  - Add a `DialogFooter` region; refactor create/rotate dialogs so action buttons live in the footer, right-aligned, primary last.
  - Keep the existing `Dialog`/`ConfirmDialog` export names so callers don't change.
  - `ConfirmDialog` (destructive: revoke/offboard/deactivate) → back it with shadcn **AlertDialog** (proper focus + role). Danger action styled destructive.
- Replace `components/ui/menu.tsx` internals with shadcn **DropdownMenu** (keyboard nav, icons, section labels, destructive item styling). Keep `Menu`/`MenuItem`/`MenuDivider` export names, or migrate call sites — whichever keeps the diff smaller.

---

## 6. PART D — Notifications & toasts (P0)

### D1. Toasts → sonner
- Add sonner `<Toaster />` in the providers tree; replace the custom `toast-provider.tsx` / `useToast` internals with sonner (keep the `showToast`/`useToast` call signature stable so feature hooks don't change — wrap sonner behind the existing API).
- **Delete the full-screen `BusyOverlay` usage.** Replace with: buttons show an inline spinner + disabled state while their mutation is pending (`isPending` from the react-query mutation), and a sonner toast fires on success/error. Optionally use sonner promise toasts. Remove `BusyOverlay` from `dashboard-workspace-app.tsx` and the `actionBusy` global if nothing else needs it.

### D2. Notifications bell + popover
- In the topbar-right, add a **bell** (`Bell`) button with an **unread-count dot/badge** (from the notifications query).
- Clicking opens a shadcn `Popover` listing the latest ~5 notifications with type icon, title, relative time, unread indicator; a "Mark all as read" action; and a "View all" link → `/dashboard/notifications` (keep that page as the full list).
- Wire it to the existing `use-notifications-workspace` data. Mark-as-read reuses existing mutation.

---

## 7. PART E — Cross-cutting polish (P0/P2)

- **Email-verified banner (P0):** show a dismissible banner at the top of the dashboard content ONLY when `session.user.emailVerified === false`, with a "Resend verification" action. Remove the permanent "Verified/Unverified" badge from the topbar.
- **Empty states (P2):** `EmptyState` gets a muted lucide icon + a primary CTA button (e.g. "Create the first secret"). Pass an optional `action` prop.
- **Avatars in tables (P2):** members, audit actor, secret created-by render `InitialsAvatar` + name instead of plain text.
- **Tooltips (P2):** every icon-only control (bell, sidebar collapse, row `…`) gets a shadcn `Tooltip`.
- **Breadcrumb (P1):** topbar-left shows `Section ▸ Subsection` via shadcn `Breadcrumb` derived from the route.
- **Command palette ⌘K (P2, optional):** shadcn `Command` dialog for quick nav + "Create …" actions.

---

## 8. Execution order

1. Part 0 (shadcn + icons + var mapping) → build, confirm no visual change.
2. Part A (shell/sidebar/topbar/identity) → the biggest visible win.
3. Part D (sonner + kill BusyOverlay + bell popover).
4. Part E email banner + breadcrumb.
5. Part C (dialogs + menus).
6. Part B (tables + controls).
7. Part E remaining polish (empty states, avatars, tooltips) + optional ⌘K.

Commit after each Part.

---

## 9. Verification

1. `npm run build` passes (static export) after each Part; `npx tsc --noEmit` clean.
2. **Color/font unchanged:** `git diff` shows no changed palette values or font families; ideally a before/after screenshot of one page matches on color/type.
3. Feature parity — walk the 3 core loops: internal share (create secret → reveal → rotate → share → revoke), vendor contract (create → accept both → share → revoke), anonymous `/access` one-time read. All still work.
4. Identity: org switcher shows org initials; user block shows user initials + role; no identity pill remains in the topbar.
5. Nav: icons on every item; active state visible; no duplicated destinations; "Settings" (not "Policy"); Recipient Access absent from dashboard nav (public `/access` still works).
6. Notifications: bell shows unread count; popover works; "View all" → page.
7. No full-screen `BusyOverlay` on actions; buttons show inline loading; sonner toasts fire.
8. Tables: headers sortable; each row has a `…` action menu; search has icon + clear; pagination shows range + page size.
9. Dialogs: X-close, footer actions; destructive actions use AlertDialog.
10. Keyboard: Tab focus visible; Esc closes dialogs/menus; icon buttons have aria-labels.

---

## 10. Explicit "do NOT" list

- Do NOT change color tokens or fonts (map shadcn vars to existing tokens).
- Do NOT change feature view prop contracts — swap primitives underneath.
- Do NOT reintroduce the deleted intent event-bus (use `?create=1` query param).
- Do NOT add features beyond Phase-1 scope.
- Do NOT break static export.
- Do NOT keep both a topbar identity pill AND a sidebar user block — identity lives in the sidebar only.

---

## 11. Expected outcome

A dashboard that reads as real SaaS: icon-driven collapsible sidebar with org switcher (top) + user block (bottom, role as subtitle), a thin topbar with Create + a notifications bell popover, sortable tables with row action menus, shadcn dialogs/menus/toasts, inline (not full-screen) loading, consistent geometry, avatars and tooltips — all on the **same colors and fonts** and with **every existing feature intact**.
