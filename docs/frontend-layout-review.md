# Tijoir Frontend — Layout & Positioning Review (per-tab, shadcn)

_Expert review of the dashboard tab layouts after the v4 + shadcn upgrade. Scope: structure, positioning, information hierarchy, and which shadcn components to use. Colors/fonts stay as-is._

---

## 1. The one problem that repeats on every tab

Every workspace tab uses a **permanent two-column master–detail** where the right column holds detail cards that render placeholder text until a row is clicked:

- Vault → "Selected secret: No secret selected" + "Reveal output: No revealed value"
- Share Links → "Selected share link" (empty)
- Vendors → "Vendor profile: No vendor profile selected" (plus a *second* table stacked under the first)

**Result: on page load, ~40% of the screen is empty placeholder boilerplate.** That is the biggest reason it still reads as a hand-rolled admin panel instead of SaaS. Real SaaS (Stripe, Linear, Vercel) gives the list the full width and opens detail **on demand** — in a slide-over drawer or a dedicated detail view — so the canvas is never half-empty.

Fix the pattern once, apply it to all three tabs. Pick **detail-in-a-drawer** (shadcn `Sheet`) as the standard interaction:

- Table takes the **full content width**.
- Each row has a `…` actions menu (already planned) + click opens a right-side **`Sheet`** with the full detail and actions.
- No empty side card ever renders.

This alone makes it look and feel like SaaS.

---

## 2. Standardize the "card" first

You have three overlapping hand-rolled containers: `PageSection`, `SurfaceCard`, `SectionCard` (different radii/padding). Replace all with shadcn **`Card`** (`Card` / `CardHeader` / `CardTitle` / `CardContent` / `CardFooter`). One card primitive → consistent geometry everywhere. Keep your colors by mapping Card's `bg-card`/`border` to existing tokens (already done in @theme).

Add these shadcn components (plugins) for the layouts below:
`card`, `sheet` (detail drawer), `tabs`, `hover-card`, `progress`, `separator`, `tooltip`, `scroll-area`. For share-link QR add a small lib: `qrcode.react`.

---

## 3. Per-tab target layouts

### 3.1 Vault
Full-width table; row click → `Sheet` on the right with the secret detail + reveal + actions. Reveal output lives **inside** the drawer (it's contextual to the selected secret, not a standalone panel).

```
┌ Vault ────────────────────────────────── [Search] [Status▾][Type▾] [+ Create secret] ┐
│ NAME            KEY           TYPE     STATUS    VERSION   UPDATED           ⋯        │
│ ────────────────────────────────────────────────────────────────────────────────── │
│ Stripe key      stripe_...    API      ● Active  v3        2h ago            ⋯        │
│ …                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
        click row →  ┌ Sheet: Stripe key ───────────────┐
                     │ (badge) Active · v3               │
                     │ DefinitionRows: key/type/created  │
                     │ [Reveal value]  → shows in drawer  │
                     │ [Rotate] [Revoke]                 │
                     └────────────────────────────────────┘
```
- Reveal stays POST-only; show the revealed value in a dark block **inside the sheet**, with a copy button and an auto-hide timer.
- Row `…` menu = Reveal / Rotate / Revoke (mirrors the sheet actions for power users).

### 3.2 Share Links (you asked: "boxes like vault")
Same master pattern. The detail drawer is where share-links become genuinely useful — this is where the "boxes" belong, furnished properly with **two content blocks**:

```
┌ Share links ─────────────── [Search][Status▾][Permission▾] [+ Create share link] ┐
│ SECRET        RECIPIENT       PERMISSION     STATUS       EXPIRES       ⋯          │
│ ──────────────────────────────────────────────────────────────────────────────  │
│ Stripe key    ops@acme.com    VIEW_ONCE      ● Active     in 3 days     ⋯          │
└──────────────────────────────────────────────────────────────────────────────── ┘
        click / after create →  ┌ Sheet: Share link ───────────────────┐
                                │ Card A — "Link"                        │
                                │   [ https://…/access/abc ]  [Copy]     │
                                │   token · [Copy]                       │
                                │   ▧ QR code (qrcode.react)             │
                                │ Card B — "Access status"               │
                                │   Views: 0 / 1   ● One-time            │
                                │   Expires: in 3 days  (Progress bar)   │
                                │   [Revoke link]                        │
                                └────────────────────────────────────────┘
```
- **Add a QR code** — big usability win for the anonymous one-time-read flow (recipient scans, no typing).
- Use `Progress` for the expiry countdown and a views `0/1` meter.
- Right after "Create share link", open this drawer automatically with the link + QR ready to copy — the create → share loop in one motion.

### 3.3 Vendors (you asked: fix the "stacked boxes")
Today the left column stacks **two tables** (Vendors table, then a Vendor-contracts table) and the right shows a profile — three panels competing, contracts hidden below the fold, and confusing. Restructure into a clean **list → detail-with-tabs**:

```
LIST (full width)
┌ Vendors ────────────────────── [Search][Status▾] [+ Add vendor] ┐
│ VENDOR             CONTACT           STATUS      CONTRACTS   ⋯    │
│ ─────────────────────────────────────────────────────────────── │
│ Acme Corp          ops@acme.com      ● Active    2           ⋯   │
└─────────────────────────────────────────────────────────────────┘
        click vendor →  DETAIL (Sheet or /dashboard/vendors/[id])
        ┌ Acme Corp  ● Active ─────────────────────────────────┐
        │  Tabs:  [ Profile ] [ Contracts ] [ Shared secrets ] │
        │  ──────────────────────────────────────────────────  │
        │  Profile:  contact, email, notes, [Offboard vendor]  │
        │  Contracts: table of contracts + [Create contract]   │
        │            status proposed→accepted→active           │
        │  Shared secrets: secrets shared under active contracts│
        └───────────────────────────────────────────────────────┘
```
- Contracts move **inside** the vendor detail as a `Tabs` panel — they only make sense in the context of a selected vendor, so stop rendering them as a second top-level table.
- Add a "Contracts" count column to the vendor row so the list is informative at a glance.
- The mutual-accept handshake (proposed → accepted-by-both → active) shows as a clear status `Badge` progression on the contract rows.

### 3.4 Overview
Keep the 5-stat row (good). Two upgrades:
- Give each `StatCard` a lucide icon (left) and, later, a small trend/delta.
- Replace the identity `DefinitionRows` block with a compact "Workspace" card + a **recent activity** list (pull last 5 audit events) — that's a far more SaaS overview than static account fields.

---

## 4. Cross-tab consistency rules

1. **One detail pattern** — `Sheet` drawer everywhere. Never a permanent empty side card.
2. **One card** — shadcn `Card`; delete `PageSection`/`SurfaceCard`/`SectionCard` duplication.
3. **Full-width tables** with `…` row actions; density comfortable; status as colored `Badge` (green/amber/red = active/pending/revoked).
4. **Create → drawer**: after any create, open the detail drawer with the new record ready to act on.
5. **Empty states** get an icon + a primary CTA (only when the list is truly empty — not as a permanent side panel).
6. Status colors follow traffic-light logic (active=green, pending/expiring=amber, revoked/expired=red).

---

## 5. shadcn components to add (summary)

| Component | Where | Why |
|-----------|-------|-----|
| `card` | all tabs | one consistent container; kills 3 hand-rolled variants |
| `sheet` | vault, share-links, vendors | on-demand detail drawer → no empty side panels |
| `tabs` | vendor detail | Profile / Contracts / Shared secrets |
| `progress` | share-links | expiry countdown + views meter |
| `hover-card` | tables | quick preview on hover (secret meta, vendor contact) |
| `separator`, `scroll-area`, `tooltip` | shell + drawers | polish + long lists |
| `qrcode.react` (lib) | share-links | scannable one-time link |

---

## 6. Priority

**P0 (kills the mediocre look):**
1. Replace permanent side panels with `Sheet` drawers on Vault + Share Links + Vendors.
2. Standardize on shadcn `Card`.
3. Full-width tables + row `…` actions + traffic-light status badges.

**P1 (makes each tab genuinely useful):**
4. Share-link drawer with QR + copy + expiry `Progress` + views meter; auto-open after create.
5. Vendor detail with `Tabs` (Profile / Contracts / Shared secrets); move contracts inside; add contracts count column.
6. Overview: stat icons + recent-activity list.

**P2 (polish):**
7. `HoverCard` row previews, tooltips, empty-state icons/CTAs.
