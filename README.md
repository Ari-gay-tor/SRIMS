# SRIMS — Stationery Requisition & Inventory Management System

A production-grade, responsive web application for managing office stationery requisitions, approvals, inventory, and issuance.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + React 18 + TypeScript
- **Styling:** Tailwind CSS + custom design tokens
- **Icons:** lucide-react
- **Charts:** Recharts (line chart, donut chart)
- **State:** Zustand (client store with mock data layer)
- **Backend (planned):** Next.js API routes + Prisma ORM + MySQL
- **Auth (planned):** NextAuth with credentials provider

## Getting Started

```bash
npm install
npm run dev
```

A `.env.local` with a working `NEXTAUTH_SECRET` is already included, so login works immediately — no setup needed beyond `npm install`.

Open http://localhost:3000

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | rahul@srims.com | Admin@123 |
| User | priya@srims.com | User@123 |
| Approver | amit@srims.com | Approver@123 |
| Inventory Mgr | sandeep@srims.com | Inventory@123 |

There's also a **role switcher** (🔄 floating button, bottom-right) on every dashboard page for quickly previewing the app as any of the four roles without logging out.

## RBAC Roles

- **Admin:** Full system access
- **Normal User:** Browse catalog, raise requisitions, track own requests
- **Approver:** Review & approve/reject assigned requisitions
- **Inventory Manager:** Process issues, manage stock, GRN entry

## Phase 5 — Bug Fixes & Polish

A round of fixes addressing dead UI interactions and missing options reported after Phase 4:

- **Requisition detail viewing** — Eye icons on My Requisitions, Approved, and Issued History were dead; they now open a shared `RequisitionDetailModal` showing full item breakdown, approval/rejection history, and totals.
- **Draft editing** — the Edit button on Drafts now actually works: it routes to `/requisitions/new?edit=<id>`, pre-fills the wizard's cart and form fields from the existing draft, and updates it in place on save instead of creating a duplicate. Delete on Drafts is now wired too (with confirmation).
- **Icon picker for Items Master** — Items previously had no way to choose a visual icon. There's now a 25-icon picker grid (the same hand-drawn glyph set used throughout the app), and the underlying `ItemIcon` component was refactored to key off `iconKey` instead of hardcoded item IDs, so custom items display correctly everywhere (cart, wizards, tables).
- **Categories icon picker expanded** from 6 to 10 options, and the picker now wraps to a grid.
- **Categories are now hierarchical in the UI** — confirmed one level of sub-categories works end-to-end with promote-on-delete behavior.
- **Profile avatar upload** — real file picker (JPG/PNG/WEBP, 2MB cap), stored as a data URL via `FileReader`, reflected immediately in both the Profile page and the Topbar avatar.
- **Help & Support** — replaced the placeholder with real contact cards (contacts@eduplex.in, csr@eduplex.in, +91 83370 56594) and a short FAQ list.
- **Dashboard overhaul** — the entire dashboard was quietly running on hardcoded fake data disconnected from the store. It's now fully live: stat cards, Low Stock Alerts, Recent Requisitions, and Recent Stock Transactions all reflect actual app state. The "This Month" trend dropdown is now a real period switcher (This Month / Last Month / Last 3 Months / This Year) with distinct datasets. All three "View All" links are wired to their destination pages — including a new **All Stock Transactions** ledger page (`/inventory/transactions`) for the stock transactions one, since no unified view existed before.

## Phase 7 — Workflow & Access Control Additions

Six feature requests, each touching a different layer of the app:

1. **Dashboard restricted from normal employees.** Hidden from the sidebar for the `USER` role, and the page itself redirects straight to My Requisitions even on a direct URL visit (`src/app/(dashboard)/dashboard/page.tsx`). The root `/` redirect is also role-aware now, so employees never even flash through `/dashboard` on login.

2. **Auto-Approval Rules** (Masters → Auto-Approval Rules, Admin + Inventory Manager only). When enabled, requisitions submitted at the configured priority level(s) — Low by default — skip Pending Approvals entirely and are marked Approved the instant they're submitted, attributed to a synthetic "Auto-Approval System" actor so Audit Logs and Approved Requisitions always show clearly which approvals were automatic vs. manual. Wired into all three places a requisition can become PENDING: a fresh submission, editing a draft and submitting it, and the "Submit" button on the Drafts list.

3. **Rejected Approvals — Eye action.** Previously you could only expand the rejection *reason* inline; there was no way to see what was actually requested. Added an Eye button that opens the same item-level detail modal used everywhere else in the app.

4. **Stock Outward, referenced by requisition.** The table now has a dedicated Requisition column. Outward movements created via Issue Items are linked automatically; the manual "Record Outward" form gained an optional "Link to Requisition" dropdown for write-offs/corrections that should still trace back to a specific requisition. One honest data note: the original seed data's seven oldest outward entries use synthetic `ISS-2025-XXXXX` reference numbers from before this feature existed and were never tied to a real requisition record — rather than fabricating a fake link for them, they correctly show "—".

5. **Custom icon upload for Categories and Items.** Both the Categories and Items Master "Icon" pickers now have an "Or upload a custom icon image" option (JPG/PNG/WEBP/SVG, 1MB cap) alongside the existing preset grids. Implementation note: rather than adding new schema fields, a custom icon is stored as a data URL directly in the same `icon`/`iconKey` string field that normally holds a preset key — `ItemIcon` and the new `CategoryIcon` helper both check for a `data:image` prefix and render an `<img>` instead of the preset lookup. This means every one of the ~10 existing places that already render these icons (cart, wizards, tables, dashboard) picked up custom icons automatically, with zero changes needed at those call sites.

6. **Requisition Analytics** (Reports → Requisition Analytics, Admin only). A new page tracking item demand patterns and per-user request behavior: highest/lowest-demand items by total quantity requested, top/bottom requesters by requisition count, a grouped bar chart comparing requested vs. issued quantity for the top 8 items, a horizontal bar chart of requisitions-by-user, and two searchable/sortable tables (full item demand breakdown with fulfillment rate, full user demand breakdown with total value). Reports also gained a real sub-menu in the sidebar (Overview / Requisition Analytics) instead of being a single flat link. User-demand stats are deliberately scoped to users who've submitted at least one requisition, so an Approver or Admin with zero submissions doesn't trivially (and misleadingly) "win" the lowest-demand spot.

**An honest limitation worth flagging:** role restrictions on pages like Auto-Approval Rules and Requisition Analytics are enforced the same way the rest of this app's role-gating already works — a client-side check against the Zustand `currentUser`, consistent with Settings, Masters → Users, and Roles & Permissions. This is a UI-level restriction for legitimate users navigating normally, not a hardened server-side authorization boundary (there's no real backend data to protect yet anyway, in mock-data mode). When real API routes are built out for these features (following the `/api/users` pattern already in place), each one will need its own server-side role check, the same way `/api/users` already does via `getServerSession`.

## Phase 6 — Remaining Dead Buttons, Then Auth & Database Groundwork

A second bug-fix pass plus the start of real backend infrastructure:

**Dead buttons fixed:**
- New Requisition: removed a redundant search button (search already filters live)
- Pending Approvals: dead "Filter" button → real Department + Priority selects
- Stock Overview: dead "Filter" button → "Clear Filters"; dead kebab (⋮) menu → real dropdown (Edit Item / Adjust Stock / Stock Outward), each deep-linking via `?edit=`/`?item=` query params that the destination pages now actually read and auto-open
- Issue Items "Save Draft" → real per-requisition draft persistence, with a "Draft saved" badge on the requisition list
- Stock Inward "Save as Draft" → real draft persistence with a resume/discard banner
- Dashboard date-range picker → a real popover that filters Recent Requisitions and Recent Stock Transactions by date

**Auth & database groundwork:**
- Prisma schema audited against everything the live app actually models — added the missing `User.avatarUrl` field, a `PasswordResetToken` model, and indexes on the columns that get filtered/sorted most (status, dates, foreign keys)
- `prisma/seed.ts` — pulls directly from `mock-data.ts` so the real database starts with the exact same demo data, with passwords properly bcrypt-hashed on the way in
- **Dual-mode authentication** — `src/lib/auth.ts` checks `DATABASE_URL` and transparently switches between the Prisma-backed path and the mock-data path, with the Prisma client instantiated lazily so the app never crashes in mock mode
- `/api/users` + `/api/users/[id]` — real Prisma-backed CRUD for the Users master, wired as best-effort calls from the store (the UI keeps working in mock mode; these calls succeed once a database is connected)
- Real **Forgot Password** flow: token generation, 1-hour expiry, and a working `/reset-password` page — only the actual email send is stubbed (logs to console)
- `Dockerfile` + `docker-compose.yml` for a one-command MySQL + app deployment

Pinned `prisma`/`@prisma/client` to `5.22.0` explicitly (rather than leaving them on whatever "latest" resolves to) since this sandbox can't run any Prisma CLI command to verify compatibility with newer majors — 5.22.0 is a version I could review with full confidence against the schema syntax used throughout this project.

## Authentication

Login is backed by **real NextAuth (Credentials provider + JWT sessions)** — not a mock — and now runs in **dual mode**:

- **No `DATABASE_URL` set** (the state this zip ships in): credentials are checked against the bundled `mock-data.ts` user list with a direct string comparison. This is what makes the app work immediately after `npm install && npm run dev`, zero setup.
- **`DATABASE_URL` set** (see "Deploying to Production" below): credentials are checked against a real MySQL database via Prisma, with bcrypt-hashed passwords. This is also what makes users created through Masters → Users **actually able to log in** — the missing piece from Phase 4/5.

Other pieces:
- `src/middleware.ts` — protects every `(dashboard)` route; unauthenticated visits redirect to `/login?callbackUrl=...`
- On successful login, the dashboard layout syncs the Zustand `currentUser` to match the authenticated session
- Sign out via the avatar menu in the Topbar actually ends the session
- **Forgot Password** is now a real flow (`/forgot-password` → `/api/auth/forgot-password` → emails a reset link... except there's no email provider configured, so the link is printed to the **server console** instead. Swap the `console.log` in `src/app/api/auth/forgot-password/route.ts` for a real send call — Resend, SES, Postmark, whatever you use — and it's done. The token generation, expiry (1 hour), and the actual `/reset-password` page are all real and functional already.) In mock-data mode (no DB), this endpoint acknowledges the request but can't issue a token, since there's nowhere durable to store one — it tells you to use the demo credentials instead.

Verified end-to-end with raw HTTP requests during development for both the mock-data path and the graceful-degradation path when `DATABASE_URL` isn't set: wrong password → `401`, correct password → session cookie issued, protected route → `200` only with a valid cookie, every new API route → clean `503` (not a crash) when no database is configured.

## Deploying to Production

This section is the actionable checklist for taking SRIMS from "demo in a zip" to "real deployment." None of the Prisma steps below could be executed inside the sandbox this was built in — every single Prisma CLI command (`generate`, `validate`, `db push`, even `--version`) tries to download an engine binary from `binaries.prisma.sh`, which isn't reachable from that sandbox's network allowlist. **This is a restriction specific to that one development environment, not a real limitation of Prisma or of this codebase** — on your own machine, with normal internet access, these commands work exactly as documented. Everything below has been carefully hand-reviewed against the schema and the app's actual data shapes, but please treat the very first run as a real test and let me know what you hit.

### Option A — Connect a real MySQL database (no Docker)

1. **Get a MySQL database.** Either install MySQL locally, or spin up a free/cheap hosted one (PlanetScale, Railway, Aiven all have simple MySQL options).
2. **Set `DATABASE_URL`** in `.env.local`:
   ```
   DATABASE_URL="mysql://user:password@host:3306/srims"
   ```
3. **Generate the Prisma Client and create the tables:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. **Seed the demo dataset** (same data you've been using in mock mode, now persisted — passwords get bcrypt-hashed):
   ```bash
   npx prisma db seed
   ```
5. **Restart the dev server.** Login now goes through the Prisma path automatically — `src/lib/auth.ts` checks `DATABASE_URL` and switches modes with no other config needed. Try adding a user via Masters → Users, then logging in as that user — that's the thing that didn't work before this was wired up.

### Option B — Docker Compose (MySQL + app in one command)

```bash
docker compose up --build
```

This starts a MySQL 8 container, builds the app image, runs `prisma db push` + `prisma db seed` automatically on startup, and serves the app on `localhost:3000`. Override the defaults (DB credentials, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`) via a `.env` file in the project root — `docker-compose.yml` reads from it automatically. For a real production rollout (not a demo), remove the `&& npx prisma db seed` from the `Dockerfile`'s `CMD` line so you don't load demo data into a real database.

The `Dockerfile` deliberately does **not** try to slim down to a minimal runtime image — the startup command needs the full Prisma CLI and `ts-node` (to run the seed script) available at container start, not just at build time. Optimizing for image size is a reasonable follow-up once schema syncing moves to a separate CI/deploy step rather than happening at container start.

### Environment variable checklist for any real deployment

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes, to leave mock mode | `mysql://user:pass@host:3306/dbname` |
| `NEXTAUTH_SECRET` | Yes | Generate your own: `openssl rand -base64 32`. The one shipped in `.env.local` is fine for local dev only. |
| `NEXTAUTH_URL` | Yes, in production | Must be the actual deployed URL (e.g. `https://srims.yourcompany.com`), not `localhost` |

### Security checklist before going live

- [ ] Rotate `NEXTAUTH_SECRET` to a freshly generated value — never reuse the one in this repo
- [ ] Confirm the 4 demo accounts' passwords are changed or the accounts are deactivated, once you have real users
- [ ] Set up a real email provider for password resets (currently logs to console — see Authentication above)
- [ ] Put real object storage (S3, Cloudinary, etc.) behind GRN attachment uploads and Profile avatars — both currently store data in-memory/as data URLs with no durable backend (see Remaining Work)
- [ ] Review the MySQL user's permissions — the seed script and `db push` need DDL rights (CREATE/ALTER TABLE), which your app's regular runtime connection probably shouldn't keep long-term in a hardened setup

## What's Built

### Core Shell
- Role-gated Sidebar (navy `#1B2A4E`, exact menu structure, collapse toggle) — now a **slide-over drawer on mobile** (<1024px) with backdrop, full push-layout on desktop
- Topbar with live notification dropdown (mark as read, mark all as read) and a working **user menu** (Profile link + real Sign Out)
- Dashboard: 5 stat cards, Requisition Trend chart, Low Stock Alerts, Recent Requisitions, Recent Stock Transactions

### Requisition Workflow
- **New Requisition** — full 3-step wizard, live cart, category tiles, search/filter, draft saving — reads items/categories from the live store
- **My Requisitions** — status filter pills, search, pagination, role-aware
- **Drafts** — edit/submit/delete actions

### Approval Workflow
- **Pending Approvals** — stat strip, detail panel, Approve/Reject/Send Back, mandatory-comment reject modal
- **Approved** — read-only list of all approved/issued/partial requisitions
- **Rejected** — read-only list with expandable rejection reason

### Issuance Workflow
- **Issue Items** — full 3-step wizard with live Short/Pending calculation. Confirming decrements live stock, creates an Issuance, writes an AuditLog.
- **Issue Queue** — approved requisitions awaiting issuance
- **Issued History** — full issuance ledger

### Inventory Workflow
- **Stock Overview** — live donut chart, filterable items table (categories pulled from store)
- **Stock Inward** — full 3-step GRN wizard with **real drag-and-drop file attachments** (type/size validated client-side, listed with remove buttons). Submitting increments live stock, creates a GRN, writes an AuditLog.
- **Stock Outward** — manual outward movement form + history (damage, write-off, internal use)
- **Adjust Stock** — increase/decrease correction form + history, shows resulting stock level live
- **Low Stock Alerts** — shortfall calculation, reorder links

### Masters (full CRUD)
- **Categories** — **hierarchical** (one level of sub-categories), add/edit/delete with icon + color picker, live item counts, deleting a parent promotes its children rather than orphaning them silently
- **Items** — add/edit/delete/toggle-active, category/unit/price/threshold fields
- **Suppliers** — add/edit/delete, shows GRN count per supplier
- **Users** — Admin-only, add/edit/delete/toggle-active, role + department assignment (self-delete blocked)
- **Roles & Permissions** — Admin-only read-only permission matrix across all 4 roles

### Reports
- Landing page with 3 report types: **Inventory Reports**, **Requisition History** (date-range filterable), **Audit Trail**
- Each report has both a working **CSV export** and a working **PDF export** (jsPDF + autotable, fully client-side, no backend needed)

### System
- **Audit Logs** — live feed of every CRUD/Approve/Reject/Issue/Stock action, expandable JSON detail view
- **Settings** — short-supply policy, email notification toggle, default threshold
- **Profile** — user info + change password form
- **Login** — real authentication against the seed accounts, with demo credential hints

### Data Layer
- `src/lib/data/mock-data.ts` — full seed dataset: 7 users, 5 departments, 6 categories, 25 items, 19 requisitions, 30 stock transactions, 3 suppliers
- `src/stores/app-store.ts` — single Zustand store wiring everything: live stock mutation, issuance creation, GRN submission, manual stock movements, full masters CRUD (users/categories/suppliers/items), audit logging, notifications, cart management
- `prisma/schema.prisma` — full MySQL schema matching the data model (not yet migrated — see Remaining Work)

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── requisitions/{new,my,drafts}/
│   │   ├── approvals/{pending,approved,rejected}/
│   │   ├── inventory/{overview,inward,outward,adjust,low-stock}/
│   │   ├── issue/{items,queue,history}/
│   │   ├── masters/{categories,items,suppliers,users,roles}/
│   │   ├── reports/
│   │   └── system/{profile,settings,audit-logs,help}/
│   ├── globals.css, layout.tsx, page.tsx
├── components/
│   ├── icons/items/ItemIcon.tsx       # per-item SVG glyphs
│   ├── layout/                        # Sidebar, Topbar, PageHeader
│   └── shared/                        # StatCard, StatusPill, DataTable,
│                                       # WizardStepper, CategoryTile, QuantityStepper
├── lib/
│   ├── data/mock-data.ts              # full seed dataset + helpers
│   ├── navigation.ts                  # role-gated nav config
│   └── utils.ts
├── stores/
│   └── app-store.ts                   # Zustand: stock, requisitions, issuances, GRNs, audit logs
└── types/
    └── index.ts
prisma/
└── schema.prisma                      # MySQL schema (not yet migrated)
```

## Remaining Work (Phase 6+)

- [ ] Run the actual `npx prisma generate` / `db push` / `db seed` commands on a real machine — they're written and reviewed but untested in this sandbox (see "Deploying to Production")
- [ ] Wire the other Masters pages (Categories, Items, Suppliers) to API routes + Prisma the same way Users now is — only Users was done as the reference pattern, since it's the one tied to auth
- [ ] GRN attachments and Profile avatars are validated/displayed client-side but not persisted to real storage (no S3/Cloudinary wired up) — they vanish on refresh
- [ ] Real email provider for password resets (token + expiry + reset page are functional; sending is currently a `console.log`)
- [ ] Lighthouse accessibility/performance pass
- [ ] Storybook or `/dev/components` showcase page (per original spec deliverable #7)

## Notes

- All app data is currently **in-memory** via Zustand — refreshing the page resets state to the seed data. This is intentional so the full UI and workflow logic can be reviewed before wiring a real database.
- Authentication is real (see above), but it checks against the static seed list server-side, not the Zustand state — so it survives refreshes (session cookie persists) even though app data doesn't.
- The role switcher (🔄 button, bottom-right) is a dev convenience layered on top of a real login — it previews different accounts' app data/permissions without needing to log out and back in. It does not bypass the auth gate itself.
- CSV and PDF exports on the Reports page are both real and fully functional, entirely client-side, no backend required.
- Try resizing your browser below 1024px width to see the sidebar collapse into a slide-over drawer with backdrop.
- Profile avatars are stored as data URLs in memory (Zustand) — like all other app data, they reset on page refresh since there's no database yet
