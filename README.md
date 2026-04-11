# Baily

Édition et envoi de quittances de loyer. Next.js 16 · Supabase · shadcn/ui · @react-pdf/renderer.

## Stack

- **Next.js 16** (App Router, TypeScript, React 19, Server Actions)
- **Tailwind v4** + **shadcn/ui**
- **Supabase** (Postgres + Auth + RLS)
- **@react-pdf/renderer** pour les PDF
- **Gmail API** via OAuth (à venir) pour l'envoi

## Démarrage

### 1. Variables d'environnement

```bash
cp .env.example .env.local
```

Récupère les clés dans ton projet Supabase (Settings → API) :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. Schéma base de données

Dans le dashboard Supabase → **SQL Editor**, exécute le contenu de `supabase/migrations/0001_init.sql`.

Cela crée `profiles`, `properties`, `tenants`, `leases`, `receipts`, active RLS partout, et ajoute un trigger pour créer le profil à l'inscription.

### 3. Auth

Magic link email. Dans Supabase :
- Authentication → URL Configuration → Site URL : `http://localhost:3000`
- Redirect URLs : `http://localhost:3000/auth/callback`

### 4. Lancer

```bash
npm run dev
```

Ouvre http://localhost:3000.

## Architecture

```
src/
├── app/
│   ├── (app)/                 # routes protégées (layout vérifie l'auth)
│   │   ├── dashboard/
│   │   ├── properties/
│   │   ├── tenants/
│   │   ├── leases/
│   │   └── receipts/
│   ├── api/receipts/[id]/pdf/ # génération PDF server-side
│   ├── auth/                  # callback magic link + signout
│   └── login/
├── components/ui/             # shadcn primitives
├── lib/
│   ├── supabase/              # client, server, middleware, types
│   ├── pdf/                   # template react-pdf
│   └── schemas.ts             # validation Zod
├── middleware.ts              # refresh session + guard
└── supabase/migrations/       # SQL
```

## Sécurité

- **RLS Supabase** sur toutes les tables, policies `auth.uid() = owner_id`
- **Server Actions** + **Zod** pour toute mutation
- **Service role key** jamais exposée côté client
- Sessions via cookies httpOnly (`@supabase/ssr`)
- Le middleware rafraîchit la session à chaque requête et redirige vers `/login` si non authentifié

## Déploiement (Vercel)

1. Push sur GitHub
2. Import dans Vercel
3. Variables d'env : copier celles de `.env.local`
4. Ajouter l'URL de prod dans Supabase → Auth → Redirect URLs
5. Deploy

## Roadmap

- [ ] Gmail OAuth (scope `gmail.send`) + route `/api/receipts/[id]/send`
- [ ] Page profil (adresse du bailleur, signature)
- [ ] Chiffrement de `gmail_refresh_token` via `pgsodium`
- [ ] Édition d'une quittance
- [ ] Batch : générer toutes les quittances du mois en un clic
- [ ] Tests (Vitest + Playwright)

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # serve build
npm run lint    # eslint
```
