# Ori Financeiro

Multi-tenant financial management SaaS. Portuguese (pt-BR) is the default locale for all user-facing text.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **UI**: shadcn/ui + Tailwind CSS v4 (dark mode first, Linear/Notion-inspired design)
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Multi-tenancy**: Row-Level Security with `organization_id` on every data table
- **Charts**: Recharts
- **Testing**: Playwright (e2e)

## Project Structure

```
src/
  app/
    (app)/        # Authenticated app routes (dashboard, transactions, accounts, etc.)
    (auth)/       # Auth routes (login, register)
    layout.tsx    # Root layout
  components/
    app-sidebar.tsx
    ui/           # shadcn/ui components
  contexts/
    org-context.tsx  # Organization context provider
  hooks/
  lib/
    supabase/     # Supabase client (client.ts, server.ts, middleware.ts)
    format.ts     # Formatting utilities
    utils.ts      # General utilities (cn helper)
  types/
    database.ts   # Supabase generated types
supabase/
  migrations/     # SQL migrations (numbered sequentially)
```

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
npx playwright test  # Run e2e tests
```

## Key Conventions

- All financial amounts are stored as **integers (cents)** — never use floats for money.
- Supabase clients: use `createClient()` from `@/lib/supabase/server` in Server Components and Route Handlers; use `createBrowserClient()` from `@/lib/supabase/client` for client-side code.
- Organization context (`useOrg()`) provides the active org for tenant-scoped queries.
- Pages use `export const dynamic = "force-dynamic"` when they need fresh data on every request.
- UI components live in `src/components/ui/`; app-level components go in `src/components/`.
- Categories use a `color` field (not `icon`).
- Migrations go in `supabase/migrations/` with sequential numbering.

## Design

- Dark mode is the default theme.
- Follow Linear/Notion aesthetic: clean, minimal, keyboard-friendly.
- Use `lucide-react` for icons.
- Use shadcn/ui primitives — don't reinvent existing components.
