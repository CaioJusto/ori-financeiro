// All granular permissions in the system
export const ALL_PERMISSIONS = [
  // Transactions
  "transactions.view", "transactions.create", "transactions.edit", "transactions.delete", "transactions.export", "transactions.import",
  // Accounts
  "accounts.view", "accounts.create", "accounts.edit", "accounts.delete", "accounts.view_balance",
  // Categories
  "categories.view", "categories.create", "categories.edit", "categories.delete",
  // Budgets
  "budgets.view", "budgets.create", "budgets.edit", "budgets.delete",
  // Goals
  "goals.view", "goals.create", "goals.edit", "goals.delete",
  // Recurring
  "recurring.view", "recurring.create", "recurring.edit", "recurring.delete", "recurring.process",
  // Reports
  "reports.view", "reports.export", "reports.print",
  // Users
  "users.view", "users.invite", "users.edit", "users.remove", "users.change_role",
  // Settings
  "settings.view", "settings.edit", "settings.branding", "settings.billing",
  // Tags
  "tags.view", "tags.create", "tags.edit", "tags.delete",
  // Contacts
  "contacts.view", "contacts.create", "contacts.edit", "contacts.delete",
  // Rules
  "rules.view", "rules.create", "rules.edit", "rules.delete",
  // Transfers
  "transfers.view", "transfers.create",
  // Installments
  "installments.view", "installments.create", "installments.edit", "installments.delete",
  // Dashboard
  "dashboard.view", "dashboard.customize",
  // Audit
  "audit.view",
  // Backup
  "backup.create", "backup.restore",
  // Credit Cards
  "credit_cards.view", "credit_cards.create", "credit_cards.edit", "credit_cards.delete",
  // Payables
  "payables.view", "payables.create", "payables.edit", "payables.delete",
  // Planning
  "planning.view", "planning.create", "planning.edit", "planning.delete",
  // Objectives
  "objectives.view", "objectives.create", "objectives.edit", "objectives.delete",
  // Notifications
  "notifications.view", "notifications.manage",
  // Attachments
  "attachments.view", "attachments.create", "attachments.delete",
  // Projections / Simulator / Health Score / Metrics / Insights / Compare
  "projections.view", "simulator.view", "health_score.view", "metrics.view", "insights.view", "compare.view",
  // Share
  "share.create",
  // Favorites
  "favorites.view", "favorites.manage",
  // Balance History
  "balance_history.view", "balance_history.create",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

// Permission modules for the UI grouping
export const PERMISSION_MODULES: { label: string; module: string; permissions: { key: string; label: string }[] }[] = [
  {
    label: "Dashboard",
    module: "dashboard",
    permissions: [
      { key: "dashboard.view", label: "Visualizar" },
      { key: "dashboard.customize", label: "Personalizar" },
    ],
  },
  {
    label: "Transações",
    module: "transactions",
    permissions: [
      { key: "transactions.view", label: "Visualizar" },
      { key: "transactions.create", label: "Criar" },
      { key: "transactions.edit", label: "Editar" },
      { key: "transactions.delete", label: "Excluir" },
      { key: "transactions.export", label: "Exportar" },
      { key: "transactions.import", label: "Importar" },
    ],
  },
  {
    label: "Contas",
    module: "accounts",
    permissions: [
      { key: "accounts.view", label: "Visualizar" },
      { key: "accounts.create", label: "Criar" },
      { key: "accounts.edit", label: "Editar" },
      { key: "accounts.delete", label: "Excluir" },
      { key: "accounts.view_balance", label: "Ver saldo" },
    ],
  },
  {
    label: "Categorias",
    module: "categories",
    permissions: [
      { key: "categories.view", label: "Visualizar" },
      { key: "categories.create", label: "Criar" },
      { key: "categories.edit", label: "Editar" },
      { key: "categories.delete", label: "Excluir" },
    ],
  },
  {
    label: "Orçamentos",
    module: "budgets",
    permissions: [
      { key: "budgets.view", label: "Visualizar" },
      { key: "budgets.create", label: "Criar" },
      { key: "budgets.edit", label: "Editar" },
      { key: "budgets.delete", label: "Excluir" },
    ],
  },
  {
    label: "Metas",
    module: "goals",
    permissions: [
      { key: "goals.view", label: "Visualizar" },
      { key: "goals.create", label: "Criar" },
      { key: "goals.edit", label: "Editar" },
      { key: "goals.delete", label: "Excluir" },
    ],
  },
  {
    label: "Recorrências",
    module: "recurring",
    permissions: [
      { key: "recurring.view", label: "Visualizar" },
      { key: "recurring.create", label: "Criar" },
      { key: "recurring.edit", label: "Editar" },
      { key: "recurring.delete", label: "Excluir" },
      { key: "recurring.process", label: "Processar" },
    ],
  },
  {
    label: "Relatórios",
    module: "reports",
    permissions: [
      { key: "reports.view", label: "Visualizar" },
      { key: "reports.export", label: "Exportar" },
      { key: "reports.print", label: "Imprimir" },
    ],
  },
  {
    label: "Usuários",
    module: "users",
    permissions: [
      { key: "users.view", label: "Visualizar" },
      { key: "users.invite", label: "Convidar" },
      { key: "users.edit", label: "Editar" },
      { key: "users.remove", label: "Remover" },
      { key: "users.change_role", label: "Alterar papel" },
    ],
  },
  {
    label: "Configurações",
    module: "settings",
    permissions: [
      { key: "settings.view", label: "Visualizar" },
      { key: "settings.edit", label: "Editar" },
      { key: "settings.branding", label: "Branding" },
      { key: "settings.billing", label: "Faturamento" },
    ],
  },
  {
    label: "Tags",
    module: "tags",
    permissions: [
      { key: "tags.view", label: "Visualizar" },
      { key: "tags.create", label: "Criar" },
      { key: "tags.edit", label: "Editar" },
      { key: "tags.delete", label: "Excluir" },
    ],
  },
  {
    label: "Contatos",
    module: "contacts",
    permissions: [
      { key: "contacts.view", label: "Visualizar" },
      { key: "contacts.create", label: "Criar" },
      { key: "contacts.edit", label: "Editar" },
      { key: "contacts.delete", label: "Excluir" },
    ],
  },
  {
    label: "Regras",
    module: "rules",
    permissions: [
      { key: "rules.view", label: "Visualizar" },
      { key: "rules.create", label: "Criar" },
      { key: "rules.edit", label: "Editar" },
      { key: "rules.delete", label: "Excluir" },
    ],
  },
  {
    label: "Transferências",
    module: "transfers",
    permissions: [
      { key: "transfers.view", label: "Visualizar" },
      { key: "transfers.create", label: "Criar" },
    ],
  },
  {
    label: "Parcelas",
    module: "installments",
    permissions: [
      { key: "installments.view", label: "Visualizar" },
      { key: "installments.create", label: "Criar" },
      { key: "installments.edit", label: "Editar" },
      { key: "installments.delete", label: "Excluir" },
    ],
  },
  {
    label: "Cartões de Crédito",
    module: "credit_cards",
    permissions: [
      { key: "credit_cards.view", label: "Visualizar" },
      { key: "credit_cards.create", label: "Criar" },
      { key: "credit_cards.edit", label: "Editar" },
      { key: "credit_cards.delete", label: "Excluir" },
    ],
  },
  {
    label: "Contas a Pagar",
    module: "payables",
    permissions: [
      { key: "payables.view", label: "Visualizar" },
      { key: "payables.create", label: "Criar" },
      { key: "payables.edit", label: "Editar" },
      { key: "payables.delete", label: "Excluir" },
    ],
  },
  {
    label: "Planejamento",
    module: "planning",
    permissions: [
      { key: "planning.view", label: "Visualizar" },
      { key: "planning.create", label: "Criar" },
      { key: "planning.edit", label: "Editar" },
      { key: "planning.delete", label: "Excluir" },
    ],
  },
  {
    label: "Objetivos",
    module: "objectives",
    permissions: [
      { key: "objectives.view", label: "Visualizar" },
      { key: "objectives.create", label: "Criar" },
      { key: "objectives.edit", label: "Editar" },
      { key: "objectives.delete", label: "Excluir" },
    ],
  },
  {
    label: "Auditoria",
    module: "audit",
    permissions: [
      { key: "audit.view", label: "Visualizar" },
    ],
  },
  {
    label: "Backup",
    module: "backup",
    permissions: [
      { key: "backup.create", label: "Criar backup" },
      { key: "backup.restore", label: "Restaurar backup" },
    ],
  },
  {
    label: "Notificações",
    module: "notifications",
    permissions: [
      { key: "notifications.view", label: "Visualizar" },
      { key: "notifications.manage", label: "Gerenciar" },
    ],
  },
  {
    label: "Anexos",
    module: "attachments",
    permissions: [
      { key: "attachments.view", label: "Visualizar" },
      { key: "attachments.create", label: "Criar" },
      { key: "attachments.delete", label: "Excluir" },
    ],
  },
  {
    label: "Outros",
    module: "misc",
    permissions: [
      { key: "projections.view", label: "Projeções" },
      { key: "simulator.view", label: "Simulador" },
      { key: "health_score.view", label: "Saúde Financeira" },
      { key: "metrics.view", label: "Métricas" },
      { key: "insights.view", label: "Insights" },
      { key: "compare.view", label: "Comparativo" },
      { key: "share.create", label: "Compartilhar" },
      { key: "favorites.view", label: "Ver favoritos" },
      { key: "favorites.manage", label: "Gerenciar favoritos" },
      { key: "balance_history.view", label: "Histórico de saldo" },
      { key: "balance_history.create", label: "Registrar saldo" },
    ],
  },
];

// Default role permission sets
export const OWNER_PERMISSIONS: string[] = [...ALL_PERMISSIONS];

export const ADMIN_PERMISSIONS: string[] = ALL_PERMISSIONS.filter(
  (p) => p !== "settings.billing" && p !== "backup.restore"
);

export const MANAGER_PERMISSIONS: string[] = [
  // Transactions
  "transactions.view", "transactions.create", "transactions.edit",
  // Accounts
  "accounts.view", "accounts.create", "accounts.edit", "accounts.view_balance",
  // Categories
  "categories.view", "categories.create", "categories.edit",
  // Budgets
  "budgets.view", "budgets.create", "budgets.edit",
  // Goals
  "goals.view", "goals.create", "goals.edit",
  // Recurring
  "recurring.view", "recurring.create", "recurring.edit",
  // Transfers
  "transfers.view", "transfers.create",
  // Installments
  "installments.view", "installments.create", "installments.edit",
  // Tags
  "tags.view", "tags.create", "tags.edit",
  // Contacts
  "contacts.view", "contacts.create", "contacts.edit",
  // Rules
  "rules.view", "rules.create", "rules.edit",
  // Reports
  "reports.view", "reports.export",
  // Dashboard
  "dashboard.view",
  // Credit Cards
  "credit_cards.view", "credit_cards.create", "credit_cards.edit",
  // Payables
  "payables.view", "payables.create", "payables.edit",
  // Planning
  "planning.view", "planning.create", "planning.edit",
  // Objectives
  "objectives.view", "objectives.create", "objectives.edit",
  // Notifications
  "notifications.view", "notifications.manage",
  // Attachments
  "attachments.view", "attachments.create",
  // Misc
  "projections.view", "simulator.view", "health_score.view", "metrics.view", "insights.view", "compare.view",
  "share.create", "favorites.view", "favorites.manage",
  "balance_history.view", "balance_history.create",
  "audit.view",
  "transactions.import",
  "transactions.export",
  "backup.create",
];

export const VIEWER_PERMISSIONS: string[] = [
  "transactions.view",
  "accounts.view", "accounts.view_balance",
  "categories.view",
  "budgets.view",
  "goals.view",
  "recurring.view",
  "transfers.view",
  "installments.view",
  "tags.view",
  "contacts.view",
  "rules.view",
  "reports.view", "reports.export",
  "dashboard.view",
  "credit_cards.view",
  "payables.view",
  "planning.view",
  "objectives.view",
  "notifications.view",
  "attachments.view",
  "projections.view", "simulator.view", "health_score.view", "metrics.view", "insights.view", "compare.view",
  "favorites.view",
  "balance_history.view",
  "audit.view",
  "share.create",
];

// Map from old permission strings to new ones
export const LEGACY_PERMISSION_MAP: Record<string, string> = {
  "transactions:read": "transactions.view",
  "transactions:write": "transactions.create",
  "accounts:read": "accounts.view",
  "accounts:write": "accounts.create",
  "categories:read": "categories.view",
  "categories:write": "categories.create",
  "budgets:read": "budgets.view",
  "budgets:write": "budgets.create",
  "goals:read": "goals.view",
  "goals:write": "goals.create",
  "recurring:read": "recurring.view",
  "recurring:write": "recurring.create",
  "installments:read": "installments.view",
  "installments:write": "installments.create",
  "transfers:read": "transfers.view",
  "transfers:write": "transfers.create",
  "tags:read": "tags.view",
  "tags:write": "tags.create",
  "contacts:read": "contacts.view",
  "contacts:write": "contacts.create",
  "payables:read": "payables.view",
  "payables:write": "payables.create",
  "planning:read": "planning.view",
  "planning:write": "planning.create",
  "credit-cards:read": "credit_cards.view",
  "credit-cards:write": "credit_cards.create",
  "objectives:read": "objectives.view",
  "objectives:write": "objectives.create",
  "rules:read": "rules.view",
  "rules:write": "rules.create",
  "reports:read": "reports.view",
  "dashboard:read": "dashboard.view",
  "notifications:read": "notifications.view",
  "notifications:write": "notifications.manage",
  "backup:read": "backup.create",
  "import:write": "transactions.import",
  "export:read": "transactions.export",
  "favorites:read": "favorites.view",
  "favorites:write": "favorites.manage",
  "simulate:read": "simulator.view",
  "health-score:read": "health_score.view",
  "metrics:read": "metrics.view",
  "insights:read": "insights.view",
  "audit:read": "audit.view",
  "activity:read": "audit.view",
  "balance-history:read": "balance_history.view",
  "balance-history:write": "balance_history.create",
  "share:write": "share.create",
  "attachments:read": "attachments.view",
  "attachments:write": "attachments.create",
  "settings:read": "settings.view",
  "settings:write": "settings.edit",
  "analytics:read": "dashboard.view",
  "templates:read": "transactions.view",
  "templates:write": "transactions.create",
  "comments:read": "transactions.view",
  "comments:write": "transactions.create",
  "preferences:read": "dashboard.view",
  "preferences:write": "dashboard.customize",
  "account-groups:read": "accounts.view",
  "account-groups:write": "accounts.create",
  "reconciliation:read": "accounts.view",
  "reconciliation:write": "accounts.create",
  "archive:write": "transactions.delete",
  "transaction-logs:read": "transactions.view",
  "invoices:read": "transactions.view",
  "invoices:write": "transactions.create",
  "investments:read": "accounts.view",
  "investments:write": "accounts.create",
  "subscriptions:read": "transactions.view",
  "subscriptions:write": "transactions.create",
  "currencies:read": "settings.view",
  "currencies:write": "settings.edit",
  "api-keys:read": "settings.edit",
  "api-keys:write": "settings.edit",
  "webhooks:read": "settings.edit",
  "webhooks:write": "settings.edit",
  "documents:read": "attachments.view",
  "documents:write": "attachments.create",
  "challenges:read": "goals.view",
  "challenges:write": "goals.create",
  "onboarding:read": "dashboard.view",
  "onboarding:write": "dashboard.view",
  "*": "*",
};

// Sidebar permission mapping: href -> required permission
export const SIDEBAR_PERMISSIONS: Record<string, string> = {
  "/": "dashboard.view",
  "/transactions": "transactions.view",
  "/reports": "reports.view",
  "/monthly": "reports.view",
  "/calendar": "transactions.view",
  "/compare": "compare.view",
  "/planning": "planning.view",
  "/accounts": "accounts.view",
  "/categories": "categories.view",
  "/budgets": "budgets.view",
  "/transfers": "transfers.view",
  "/credit-cards": "credit_cards.view",
  "/recurring": "recurring.view",
  "/goals": "goals.view",
  "/installments": "installments.view",
  "/payables": "payables.view",
  "/tags": "tags.view",
  "/contacts": "contacts.view",
  "/rules": "rules.view",
  "/projections": "projections.view",
  "/objectives": "objectives.view",
  "/simulator": "simulator.view",
  "/health": "health_score.view",
  "/audit": "audit.view",
  "/import": "transactions.import",
  "/settings": "settings.view",
  "/settings/users": "users.view",
  "/settings/branding": "settings.branding",
  "/settings/roles": "users.view",
  "/analytics": "dashboard.view",
  "/templates": "transactions.view",
  "/notifications": "notifications.view",
  "/settings/preferences": "settings.view",
  "/cashflow": "reports.view",
  "/invoices": "transactions.view",
  "/investments": "accounts.view",
  "/subscriptions": "transactions.view",
  "/tax": "reports.view",
  "/bills": "payables.view",
  "/challenges": "goals.view",
  "/documents": "attachments.view",
  "/settings/currencies": "settings.view",
  "/settings/api-keys": "settings.edit",
  "/settings/webhooks": "settings.edit",
};
