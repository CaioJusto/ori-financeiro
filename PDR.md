# PDR - Ori Financeiro

## Overview

Multi-tenant financial management SaaS for cash flow control, transaction categorization, and financial reporting. Inspired by Linear/Notion design language.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| State | React Server Components + client hooks |
| Auth | Supabase Auth (email/password, magic link) |
| Multi-tenancy | Row-Level Security (RLS) with `organization_id` |

## Architecture

### Multi-Tenancy Model

- **Organization-based**: Each tenant is an `organization`. Users belong to one or more organizations via `org_members`.
- **RLS enforcement**: Every data table includes `organization_id`. Supabase RLS policies filter all queries by the user's active organization.
- **Tenant switching**: Users can switch between organizations in the UI header.

### Data Model (Core Tables)

```
organizations
  id, name, slug, created_at

org_members
  id, organization_id, user_id, role (owner|admin|member), created_at

cash_accounts
  id, organization_id, name, type (personal|company|cash2), balance, currency, created_at

transactions
  id, organization_id, cash_account_id, amount, type (income|expense|transfer),
  description, date, created_by, created_at

tags
  id, organization_id, name, color, created_at

transaction_tags
  transaction_id, tag_id

categories
  id, organization_id, name, parent_id, icon, created_at
```

### Key Features (v1)

1. **Cash Management**
   - Three account types: Personal ("Meu Caixa"), Company ("Caixa da Empresa"), Cash 2 ("Caixa 2")
   - Real-time balance tracking per account
   - Transfer between accounts

2. **Transaction Recording**
   - Income and expense entries with date, amount, description
   - Category assignment (hierarchical categories)
   - Tag-based filtering and grouping

3. **Tag System**
   - Custom colored tags per organization
   - Multi-tag support on transactions
   - Filter/search by tags

4. **Dashboard**
   - Summary cards (total balance, income/expense this month)
   - Cash flow chart (line/bar)
   - Recent transactions list

5. **Authentication & Authorization**
   - Email/password signup and login
   - Organization creation on first login
   - Role-based access (owner, admin, member)

### Page Structure

```
/login                  - Auth page
/register               - Registration page
/dashboard              - Main dashboard with summary
/transactions           - Transaction list with filters
/transactions/new       - Create transaction
/accounts               - Cash accounts overview
/accounts/[id]          - Account detail + transactions
/tags                   - Tag management
/settings               - Organization settings
/settings/members       - Team member management
```

### Design Principles

- **Linear-inspired**: Clean, minimal UI. Keyboard-first navigation. Command palette (Cmd+K).
- **Notion-inspired**: Flexible views. Clean typography. Subtle animations.
- **Dark mode first**: Default dark theme with light mode toggle.
- **Responsive**: Mobile-friendly sidebar that collapses.

## Non-Functional Requirements

- All financial amounts stored as integers (cents) to avoid floating-point issues
- Optimistic UI updates for transaction CRUD
- Supabase realtime subscriptions for multi-user sync
- Portuguese (pt-BR) as default locale

## Phase Plan

| Phase | Scope |
|-------|-------|
| P0 (Now) | Project scaffold, auth, multi-tenant schema, basic layout |
| P1 | Cash accounts CRUD, transactions CRUD, tags |
| P2 | Dashboard with charts, filters, search |
| P3 | Reports, exports, advanced categorization |
