# Tijoir Frontend UI/UX Specification

This document is the working UI/UX reference for the Tijoir frontend.

It exists to keep the product simple to use even when the backend logic is
security-heavy. The user should feel like they are using a calm, clear SaaS
workspace, not a developer console or security demo.

## Core Product Principle

Tijoir should feel like:

- a clean SaaS workspace
- simple enough for a non-technical operator
- serious enough for a security-sensitive product
- structured enough to scale with more features later

Tijoir should not feel like:

- a backend test harness
- an API playground
- a threat-war-room dashboard
- a noisy admin panel with repeated cards and banners

## Design Direction

The UI direction should combine:

- the calm layout discipline of modern SaaS dashboards
- the seriousness of security/status signaling
- the density of an operational tool
- the simplicity of a product anyone can learn quickly

The main rule:

> Make every screen feel like a calm operations tool, not a technical demo.

## Product Structure

### Public routes

- `/`
- `/login`
- `/signup`
- `/verify`
- `/invite`
- `/access`

### Protected routes

- `/dashboard/overview`
- `/dashboard/vault`
- `/dashboard/share-links`
- `/dashboard/vendors`
- `/dashboard/organization`
- `/dashboard/audit`
- `/dashboard/settings`
- `/dashboard/recipient`

### Route intent

- `Overview`: workspace summary only
- `Vault`: secrets inventory and secret detail actions
- `Share Links`: recipient-access management
- `Vendors`: external entity and contract management
- `Organization`: org profile, members, invites, role management
- `Audit`: filterable security activity ledger
- `Settings`: policy and organization controls
- `Recipient`: operator-side public flow test surface
- `/access`: actual public recipient access experience

## Information Architecture

### Sidebar

The sidebar must:

- stay on the left on desktop
- remain sticky on long pages
- slide in from the left on mobile
- never move to the top as the primary nav pattern

### Sidebar items

Recommended order:

1. Overview
2. Vault
3. Share Links
4. Vendors
5. Organization
6. Audit
7. Settings
8. Recipient Access

### Top bar

The top bar should contain:

- current page title
- organization name
- current user identity
- user role
- a compact global `Create` menu
- account menu
- refresh action

The top bar should not contain:

- backend URLs
- environment/debug strings
- technical response messages
- too many primary buttons at once

## Page-Level Rules

### Overview page

Overview should contain only the workspace summary.

It should have:

- 4 to 5 KPI cards max
- workspace summary panel
- quick actions panel
- current focus / next-step panel

It should not repeat:

- detailed tables
- every page-level metric again
- technical status copy

### Inventory pages

These pages should use a shared pattern:

- Vault
- Share Links
- Vendors
- Audit
- Organization sub-areas where appropriate

Recommended layout:

- left: main table / inventory
- right: detail panel or secondary guidance

This is better than stacking many disconnected cards.

### Organization page

The organization page should act as the admin surface for:

- org profile
- current signed-in context
- members
- invites
- access guidance
- settings entry

Later this can become tabbed:

- Profile
- Members
- Invites
- Policy

### Recipient access page

The recipient flow must be simpler than the admin workspace.

Ideal sequence:

1. paste token
2. inspect access details
3. reveal if allowed
4. copy value

The public page must not use internal/admin wording.

## Current Color System

These are the current frontend tokens from `frontend/src/app/globals.css`,
with human-readable color names attached.

### Base surface colors

- `--color-surface: #F5F9FF`
  - name: `Cloud White`
- `--color-surface-strong: #E9F1FF`
  - name: `Mist Blue`
- `--color-dashboard-bg: #EEF4FF`
  - name: `Ice Blue`
- `--color-brand-panel: #EDF4FF`
  - name: `Powder Blue`

### Text colors

- `--color-ink: #16324F`
  - name: `Deep Slate Blue`
- `--color-ink-strong: #0D2240`
  - name: `Midnight Navy`
- `--color-muted: #59708D`
  - name: `Storm Gray Blue`

### Border colors

- `--color-border: #D7E3F4`
  - name: `Soft Steel Blue`
- `--color-border-strong: #B7CAE6`
  - name: `Cool Sky Border`
- `--color-dashboard-border: #D4E2F5`
  - name: `Frost Border`

### Brand colors

- `--color-brand: #2563EB`
  - name: `Trust Blue`
- `--color-brand-strong: #1D4ED8`
  - name: `Action Blue`
- `--color-brand-soft: #DBEAFE`
  - name: `Pale Sky Blue`
- `--color-brand-ring: rgba(37, 99, 235, 0.14)`
  - name: `Blue Focus Ring`

### Navigation color

- `--color-sidebar: #0F2F63`
  - name: `Anchor Navy`

### Shadow

- `--shadow-card: 0 14px 36px rgba(15, 47, 99, 0.08)`
  - name: `Soft Navy Shadow`

## Recommended Color Usage

### Core guidance

- White and soft blue should be the default mood
- Primary blue should represent trust, action, and focus
- Gray-blue should carry secondary text and background structure
- Success/warning/error should be accents only

### Do use

- white or near-white surfaces
- one main blue family
- quiet gray/blue borders
- soft status badges

### Do not use

- neon security colors everywhere
- heavy purple gradients
- dark threat-center styling across the main app
- multiple accent colors competing on the same screen

## Typography

Use `Inter`.

### Type scale

- Page title: `28px`, `600`
- Section title: `18px`, `600`
- Card title: `14px`, `500`
- Body text: `14px`, `400`
- Small meta text: `12px`, `400-500`
- Table text: `13px`
- KPI number: `24px` to `28px`, `600`

### Typography rules

- no hero-style dashboard text
- no viewport-based font scaling
- no negative letter spacing
- use consistent casing in labels
- prefer sentence case for headings and UI labels

## Spacing and Sizing

### Layout spacing

- page padding desktop: `24px`
- page padding mobile: `16px`
- card padding: `16px` to `20px`
- section gap: `16px`
- tight inner gap: `8px` to `12px`

### Component sizing

- card radius: `12px`
- button height: `40px` to `44px`
- input height: `40px` to `44px`
- table row height: `52px` to `56px`
- dialog width:
  - confirm: `420px` to `480px`
  - form: `560px` to `640px`

### Density rule

The first viewport should contain:

- the page title
- the filter/action bar
- the beginning of the table or the main work area

Avoid giant blank gaps above the fold.

## Cards and Surfaces

### Card rules

- one main surface layer is preferred
- avoid nested cards inside cards unless the nested item is a small stat block
- keep cards flatter and more compact
- cards should align cleanly in height and spacing

### Where cards are appropriate

- summary KPIs
- detail panels
- modals
- empty states
- secondary guidance panels

## Tables

Tables are the main interaction model for Tijoir.

### Tables should be used for

- Vault inventory
- Share-link inventory
- Vendor registry
- Contracts
- Members
- Invites
- Audit events

### Table requirements

- sticky header later
- compact rows
- clear status badges
- selected row state
- hover state
- filter/search bar above
- pagination below
- empty state
- loading skeleton

### Action pattern

Prefer:

- row click for detail
- dropdown or compact action group for secondary actions

Avoid:

- many equal-weight inline buttons in every row

## Detail Panel Pattern

For Vault, Share Links, and Vendors:

- left side: table
- right side: detail panel

The detail panel should show:

- primary metadata
- current status
- main actions
- risk or behavior notes
- latest selected context

## Buttons and Actions

### Hierarchy

- 1 primary action per page
- secondary actions outlined or neutral
- destructive actions red only when needed

### Good page-level primary actions

- Vault: `Create secret`
- Share Links: `Create share link`
- Vendors: `Create vendor`
- Organization: `Invite member`
- Settings: `Save policy`

## Dialogs and Modals

Use dialogs for:

- create flows
- edit flows
- destructive confirmation

### Dialog rules

- single-column layout
- labels above fields
- footer actions fixed and obvious
- destructive text must name the actual target object
- avoid huge full-screen modal forms unless required later

## Forms

### Form behavior

- labels above controls
- helper text only when needed
- validation under field
- keep advanced options collapsed or secondary
- hide backend concepts from operators

### Do not expose in UI

- backend endpoints
- metadata URL / consume URL internals
- raw API language
- system response/debug text

## Loading, Buffering, and Feedback

### Loading patterns

Use:

- skeleton tables for list loading
- skeleton detail panel when selection loads
- button spinner/disabled state for mutation
- overlay only for truly blocking work

Do not use:

- persistent “system response” banners
- technical “live backend APIs” copy
- frequent full-page blocking loaders for minor actions

### Good loading copy

- `Saving policy`
- `Creating share link`
- `Checking access`
- `Refreshing workspace`

Bad loading copy:

- `Calling backend API`
- `System response received`
- `Workspace loaded from live backend APIs`

### Toast rules

- top-right is fine
- auto-dismiss in `3.5` to `4.5` seconds
- title + short detail only
- confirm user outcome, not internal implementation

Examples:

- `Share link created`
- `Vendor offboarded`
- `Secret rotated`
- `Could not save changes`

## Empty States

Every empty state should answer:

- what this area is
- why it is empty
- what the user should do next

Examples:

- `No secrets yet`
- `No share links yet`
- `No vendor selected`
- `No access details yet`

## Copy Rules

### Product voice

Use operator-friendly language.

Preferred words:

- `recipient access`
- `shared access`
- `organization`
- `team`
- `reveal secret`
- `access details`

Avoid or reduce:

- `backend`
- `API`
- `consume endpoint`
- `metadata endpoint`
- `system response`
- `live backend`

## Immediate Frontend Improvement Checklist

### High priority

- unify Vault, Vendors, Share Links, and Audit into one common layout rhythm
- move row actions toward compact menus
- add sticky table headers
- improve right-side detail loading states
- keep main table and filters visible in first viewport

### Medium priority

- make `Organization` page tabbed
- improve recipient access page mobile polish
- standardize modal footer layout
- add notification center later

### Later

- consider selective `shadcn/ui`-style primitive migration
- add theme support only if the product really needs it
- add more advanced stateful charts only where there is real user value

## Final Rule

Tijoir should hide complexity, not display it.

The backend can stay complex. The UI must remain obvious.
