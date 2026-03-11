# Ori Financeiro — Skill Guide

Reference for contributing to the Ori Financeiro project.

## Adding a New Page

1. Create a folder under `src/app/(app)/<page-name>/`.
2. Add `page.tsx` with a default export (Server Component by default).
3. For client interactivity, use `"use client"` directive and import `useOrg()` for tenant context.
4. Add a sidebar link in `src/components/app-sidebar.tsx`.

## Adding a Supabase Migration

1. Create a new SQL file in `supabase/migrations/` with the next sequential number (e.g., `008_description.sql`).
2. Every table must include `organization_id UUID NOT NULL REFERENCES organizations(id)`.
3. Add RLS policies that filter by the user's active organization.
4. Update `src/types/database.ts` with new types if needed.

## Adding a UI Component

1. Use `npx shadcn@latest add <component>` when a shadcn primitive exists.
2. Custom components go in `src/components/ui/` for reusable pieces, or directly in the page folder for page-specific components.
3. Use `cn()` from `@/lib/utils` to merge Tailwind classes.

## Data Flow Pattern

```
Server Component (page.tsx)
  → createClient() from @/lib/supabase/server
  → Query Supabase with organization_id filter (RLS handles enforcement)
  → Pass data as props to Client Components

Client Component ("use client")
  → useOrg() for current organization
  → createBrowserClient() for mutations
  → Optimistic UI updates when appropriate
```

## Formatting

- Use `formatCurrency()` and `formatDate()` from `@/lib/format.ts` for consistent display.
- All amounts are in cents; format for display only at the UI layer.

## Testing

- E2E tests go in `tests/` using Playwright.
- Test against a running dev server with seeded data.
- Configuration in `playwright.config.ts`.

## Common Tasks

| Task | Where |
|------|-------|
| Add a new route | `src/app/(app)/<name>/page.tsx` |
| Add a sidebar item | `src/components/app-sidebar.tsx` |
| Add a shadcn component | `npx shadcn@latest add <name>` |
| Create a migration | `supabase/migrations/<NNN>_<name>.sql` |
| Update DB types | `src/types/database.ts` |
| Add a chart | Use Recharts, see `src/app/(app)/reports/` for examples |
| Add formatting helpers | `src/lib/format.ts` |
