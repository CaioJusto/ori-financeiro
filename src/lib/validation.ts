export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: ValidationError[];
}

export function createApiError(message: string, details?: ValidationError[]): ApiErrorResponse {
  return { error: "VALIDATION_ERROR", message, details };
}

export function createServerError(message: string = "Erro interno do servidor"): ApiErrorResponse {
  return { error: "SERVER_ERROR", message };
}

export function createNotFoundError(resource: string = "Recurso"): ApiErrorResponse {
  return { error: "NOT_FOUND", message: `${resource} não encontrado(a)` };
}

export function createUnauthorizedError(): ApiErrorResponse {
  return { error: "UNAUTHORIZED", message: "Você precisa estar autenticado para realizar esta ação" };
}

export function validateRequired(value: unknown, fieldName: string): ValidationError | null {
  if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
    return { field: fieldName, message: `${fieldName} é obrigatório` };
  }
  return null;
}

export function validateNumber(value: unknown, fieldName: string, opts?: { min?: number; max?: number }): ValidationError | null {
  const num = Number(value);
  if (isNaN(num)) return { field: fieldName, message: `${fieldName} deve ser um número válido` };
  if (opts?.min !== undefined && num < opts.min) return { field: fieldName, message: `${fieldName} deve ser pelo menos ${opts.min}` };
  if (opts?.max !== undefined && num > opts.max) return { field: fieldName, message: `${fieldName} deve ser no máximo ${opts.max}` };
  return null;
}

export function validateEmail(value: string, fieldName: string = "Email"): ValidationError | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { field: fieldName, message: `${fieldName} inválido` };
  }
  return null;
}

export function validateDate(value: string, fieldName: string = "Data"): ValidationError | null {
  if (!value || isNaN(Date.parse(value))) {
    return { field: fieldName, message: `${fieldName} inválida` };
  }
  return null;
}

export function validateMinLength(value: string, min: number, fieldName: string): ValidationError | null {
  if (value.length < min) {
    return { field: fieldName, message: `${fieldName} deve ter pelo menos ${min} caracteres` };
  }
  return null;
}

// Client-side form validation helper
export function validateTransactionForm(form: { description: string; amount: string; accountId: string; categoryId: string; date: string }): ValidationError[] {
  const errors: ValidationError[] = [];
  const desc = validateRequired(form.description, "Descrição");
  if (desc) errors.push(desc);
  const amt = validateRequired(form.amount, "Valor");
  if (amt) errors.push(amt);
  else {
    const num = validateNumber(form.amount, "Valor", { min: 0.01 });
    if (num) errors.push(num);
  }
  const acc = validateRequired(form.accountId, "Conta");
  if (acc) errors.push(acc);
  const cat = validateRequired(form.categoryId, "Categoria");
  if (cat) errors.push(cat);
  const dt = validateDate(form.date, "Data");
  if (dt) errors.push(dt);
  return errors;
}

export function validateAccountForm(form: { name: string }): ValidationError[] {
  const errors: ValidationError[] = [];
  const name = validateRequired(form.name, "Nome");
  if (name) errors.push(name);
  return errors;
}

export function validateCategoryForm(form: { name: string }): ValidationError[] {
  const errors: ValidationError[] = [];
  const name = validateRequired(form.name, "Nome");
  if (name) errors.push(name);
  return errors;
}

export function validateBudgetForm(form: { categoryId: string; limit: string }): ValidationError[] {
  const errors: ValidationError[] = [];
  const cat = validateRequired(form.categoryId, "Categoria");
  if (cat) errors.push(cat);
  const lim = validateRequired(form.limit, "Limite");
  if (lim) errors.push(lim);
  else {
    const num = validateNumber(form.limit, "Limite", { min: 0.01 });
    if (num) errors.push(num);
  }
  return errors;
}

export function validateGoalForm(form: { name: string; targetAmount: string }): ValidationError[] {
  const errors: ValidationError[] = [];
  const name = validateRequired(form.name, "Nome");
  if (name) errors.push(name);
  const amt = validateRequired(form.targetAmount, "Valor alvo");
  if (amt) errors.push(amt);
  else {
    const num = validateNumber(form.targetAmount, "Valor alvo", { min: 0.01 });
    if (num) errors.push(num);
  }
  return errors;
}
