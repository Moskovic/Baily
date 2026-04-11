@AGENTS.md

# Baily — Project Context

## What is Baily?
A web app to create, preview, and email rent receipts (quittances de loyer) to tenants.
Built for the owner (Marius) and friends. Could become a SaaS.

## Stack
- **Next.js 16.2.2** (App Router, Turbopack, Server Actions, React 19)
- **Tailwind v4** + **shadcn/ui** (hand-written components in `src/components/ui/`)
- **Supabase** (Postgres + Auth via magic link / OTP + RLS on every table)
- **@react-pdf/renderer** for PDF generation (server-side, `renderToBuffer`)
- **Gmail API** (OAuth2, offline refresh token) for sending receipts from user's own Gmail
- **Zod** for validation, **sonner** for toasts, **lucide-react** for icons
- Deploy target: **Vercel** (free tier)

## Supabase project
- Project ID: `oshbsqaqjmekybgchejk`
- URL: `https://oshbsqaqjmekybgchejk.supabase.co`
- Env vars in `.env.local` (git-ignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Auth: magic link + OTP code (6-digit), template customized in Supabase dashboard
- Auth callback: `/auth/confirm` (uses `token_hash` + `type` params, NOT the old `/auth/callback` code exchange)
- Login flow: user enters email → gets 6-digit code → types it → `verifyOtp({ type: "magiclink" })` client-side

## Google OAuth (Gmail)
- Google Cloud project created, Gmail API enabled
- OAuth consent screen: external, test mode (test users manually added)
- Scope: `gmail.send` + `userinfo.email` + `openid`
- Credentials in `.env.local`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Redirect URIs: `http://localhost:3000/api/gmail/callback` (dev), `https://baily.app/api/gmail/callback` (prod)
- Flow: `/api/gmail/connect` → Google consent → `/api/gmail/callback` → stores `gmail_refresh_token` + `gmail_email` in `profiles` table
- Send: `/api/receipts/[id]/send` (POST) → refreshes token → builds MIME email with PDF attachment → Gmail API `users.messages.send`
- Supports HTML+text multipart emails (used for overdue reminders with action buttons)

## Database schema (migrations in `supabase/migrations/`)
All tables have RLS enabled with `auth.uid() = owner_id` policies.

### Tables
- **profiles** (id=auth.users.id): full_name, company_name, address, gmail_refresh_token, gmail_email, gmail_connected_at, signature_data_url
- **properties**: owner_id, label, type (`apartment`|`garage`), address, city, postal_code
- **tenants**: owner_id, full_name, email, phone
- **leases**: owner_id, property_id, tenant_id, rent_amount, charges_amount, payment_day, start_date, end_date
- **receipts**: owner_id, lease_id, period_month, period_year, rent_amount, charges_amount, payment_date, status (`draft`|`sent`|`paid`), sent_at. Unique constraint on (lease_id, period_year, period_month)

### Migrations applied
- 0001_init.sql — all tables + RLS + triggers
- 0002_gmail.sql — gmail_email, gmail_connected_at columns
- 0003_property_type.sql — type column on properties
- 0004_signature.sql — signature_data_url column on profiles

## App structure
```
src/
├── app/
│   ├── page.tsx                    # Landing page (public, with violet glow hero)
│   ├── login/page.tsx              # OTP code login (client component)
│   ├── auth/
│   │   ├── confirm/route.ts        # Magic link token_hash verification
│   │   ├── callback/route.ts       # Legacy code exchange (kept for compat)
│   │   └── signout/route.ts        # POST → sign out
│   ├── (app)/                      # Protected layout (checks auth, has sidebar)
│   │   ├── layout.tsx              # Floating sidebar + main card layout
│   │   ├── dashboard/              # KPI cards (shiny 3D card), overdue calendar, test reminder button
│   │   ├── properties/             # CRUD with type (apartment/garage), edit dialog
│   │   ├── tenants/                # CRUD with edit dialog
│   │   ├── leases/                 # CRUD with property/tenant selects, edit dialog
│   │   ├── receipts/
│   │   │   ├── page.tsx            # List grouped by month in <details> drawers, year dropdown filter
│   │   │   ├── [id]/page.tsx       # Preview: iframe PDF + detail cards + Send/Download/Edit buttons
│   │   │   ├── [id]/edit-dialog.tsx
│   │   │   ├── prepare/route.ts    # Find-or-create receipt for lease+period, redirect to preview
│   │   │   └── ...
│   │   └── settings/               # Profile form, signature pad, Gmail connect/disconnect
│   └── api/
│       ├── gmail/connect/          # GET → redirect to Google OAuth
│       ├── gmail/callback/         # GET → exchange code, store tokens
│       └── receipts/[id]/
│           ├── pdf/route.tsx       # GET → generate + stream PDF
│           └── send/route.tsx      # POST → generate PDF + send via Gmail
├── components/
│   ├── ui/                         # shadcn primitives (button, input, card, table, dialog, select, badge, label, separator, sonner)
│   ├── nav-link.tsx                # Sidebar active-state link
│   ├── page-header.tsx             # Page title with eyebrow support
│   ├── empty-state.tsx             # Polished empty state with icon + glow
│   ├── shiny-card.tsx              # 3D tilt + cursor-following shine effect
│   └── signature-pad.tsx           # Canvas drawing pad (1200x360 internal res)
├── lib/
│   ├── utils.ts                    # cn(), formatCurrency(), formatDate()
│   ├── schemas.ts                  # Zod schemas + PROPERTY_TYPES constant
│   ├── supabase/                   # client.ts, server.ts, middleware.ts (no generic DB types, use `any`)
│   ├── pdf/receipt-template.tsx    # @react-pdf/renderer template with signature support
│   └── gmail/
│       ├── oauth.ts                # buildAuthUrl, exchangeCodeForTokens, refreshAccessToken, fetchUserEmail
│       └── send.ts                 # sendEmailViaGmail (text + HTML + attachment support)
├── middleware.ts                   # Supabase session refresh + route protection
└── .claude/launch.json             # Dev server config for preview_start
```

## UI / Design decisions
- **Violet accent**: primary `oklch(0.55 0.22 280)`, gradient `brand-from → brand-to` (violet→fuchsia)
- CSS utilities: `.brand-text` (gradient text), `.brand-glow` (radial gradient surface)
- **Floating sidebar**: rounded-2xl card, sticky, with `bg-muted/30` page background
- **Shiny KPI card**: 3D tilt on hover with cursor-following highlight + specular sheen (ShinyCard component)
- **Empty states**: centered icon (in primary/10 rounded box with blur halo) + title + description + CTA
- **Receipts list**: grouped by month in `<details>` native drawers, current month open by default, year selector dropdown
- **Dashboard**: 4 stat cards (uniform layout: icon+label row, big number below), overdue calendar with clickable status badges
- **Signature pad**: canvas 1200x360, lineWidth 6, exports PNG dataURL, shown in PDF at 220x90pt

## Overdue reminder system
- Dashboard has "Tester le rappel" button → server action detects overdue leases (payment_day past + no receipt this month)
- Sends HTML email to the owner via their Gmail with styled cards per overdue lease
- Each card has a "Préparer →" button linking to `/receipts/prepare?lease=...&month=...&year=...`
- That route auto-creates the receipt if needed, then redirects to `/receipts/[id]` preview page where user can send

## Known issues / warnings
- Next.js 16 deprecation warning: `middleware` → `proxy` (cosmetic, works fine)
- Supabase DB types not generated (removed hand-written types that caused build errors — use `npx supabase gen types` when needed)
- `gmail_refresh_token` stored in plain text (TODO: encrypt with pgsodium/vault before prod)
- Hydration mismatch can occur after many HMR edits — fix by clearing `.next` cache and restarting dev server

## Deployment
- **Domain**: `baily.app`
- **Vercel**: project `baily`, auto-deploys from GitHub `Moskovic/Baily`
- **GitHub**: `https://github.com/Moskovic/Baily`
- **Prod URL**: `https://baily.app`
- **Env vars**: configured in Vercel (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
- **Supabase Auth**: Site URL = `https://baily.app`, Redirect URLs includes `https://baily.app/**`
- **Google OAuth**: redirect URI = `https://baily.app/api/gmail/callback`

## Roadmap / TODO
- [ ] Automatic overdue reminders via Vercel Cron (`/api/cron/overdue-reminders`)
- [ ] Batch receipt generation (all leases for a month in one click)
- [ ] Dark mode toggle
- [ ] Encrypt gmail_refresh_token via pgsodium
- [ ] Generate Supabase types with CLI
- [ ] Tests (Vitest + Playwright)

## Commands
```bash
npm run dev       # dev server (port 3000)
npm run build     # production build
npm run lint      # eslint
```
