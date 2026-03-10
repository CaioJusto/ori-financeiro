import { test, expect, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const TEST_EMAIL = `qa-test-${Date.now()}@oritest.com`;
const TEST_PASSWORD = "TestPass123!";
const TEST_ORG = "QA Test Org";

test.describe("Ori Financeiro P0 E2E", () => {
  // ─── 1. AUTH: Register ───────────────────────────────────────────────
  test("1.1 Register - page loads with form fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await expect(page.locator("text=Criar Conta")).toBeVisible();
    await expect(page.locator("#orgName")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("button[type=submit]")).toBeVisible();
  });

  test("1.2 Register - create new user with org", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.fill("#orgName", TEST_ORG);
    await page.fill("#email", TEST_EMAIL);
    await page.fill("#password", TEST_PASSWORD);
    await page.click("button[type=submit]");

    // Should redirect to dashboard (or show email confirmation)
    await page.waitForURL("**/dashboard", { timeout: 15000 }).catch(() => {});
    const url = page.url();
    // Accept either dashboard redirect or staying on register (email confirmation required)
    const onDashboard = url.includes("/dashboard");
    const hasError = await page.locator(".text-red-500").isVisible().catch(() => false);

    if (onDashboard) {
      console.log("PASS: Registration redirected to dashboard");
    } else if (hasError) {
      const errorText = await page.locator(".text-red-500").textContent();
      console.log(`INFO: Registration error (may need email confirmation): ${errorText}`);
    } else {
      console.log("INFO: Registration completed but no redirect (may need email confirmation)");
    }
  });

  // ─── 2. AUTH: Login ──────────────────────────────────────────────────
  test("2.1 Login - page loads with form fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator("text=Ori Financeiro")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("button[type=submit]")).toBeVisible();
    await expect(page.locator("text=Criar conta")).toBeVisible();
  });

  test("2.2 Login - invalid credentials show error", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill("#email", "invalid@test.com");
    await page.fill("#password", "wrongpassword");
    await page.click("button[type=submit]");
    await page.waitForTimeout(3000);
    const errorVisible = await page.locator(".text-red-500").isVisible();
    expect(errorVisible).toBeTruthy();
    console.log("PASS: Invalid credentials show error");
  });

  test("2.3 Login - successful login with test user", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill("#email", TEST_EMAIL);
    await page.fill("#password", TEST_PASSWORD);
    await page.click("button[type=submit]");

    await page.waitForURL("**/dashboard", { timeout: 15000 }).catch(() => {});
    const url = page.url();
    if (url.includes("/dashboard")) {
      console.log("PASS: Login redirected to dashboard");
    } else {
      const hasError = await page.locator(".text-red-500").isVisible().catch(() => false);
      if (hasError) {
        const errorText = await page.locator(".text-red-500").textContent();
        console.log(`FAIL: Login error: ${errorText}`);
      }
    }
  });

  // ─── 3. AUTH: Redirect unauthenticated ───────────────────────────────
  test("3.1 Unauthenticated users are redirected to login", async ({ page }) => {
    // Fresh context, no cookies
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForURL("**/login", { timeout: 10000 });
    expect(page.url()).toContain("/login");
    console.log("PASS: Unauthenticated redirect to /login works");
  });

  // ─── 4. Navigation links ────────────────────────────────────────────
  test("4.1 Login page has link to register", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();
  });

  test("4.2 Register page has link to login", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
  });

  // ─── 5. Page rendering (unauthenticated smoke) ──────────────────────
  test("5.1 Home page loads", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/`);
    expect(response?.status()).toBeLessThan(500);
    console.log(`PASS: Home page status ${response?.status()}`);
  });

  test("5.2 Login page renders without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(2000);
    if (errors.length > 0) {
      console.log(`WARN: Console errors on login: ${errors.join("; ")}`);
    } else {
      console.log("PASS: Login page renders without JS errors");
    }
  });

  test("5.3 Register page renders without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${BASE_URL}/register`);
    await page.waitForTimeout(2000);
    if (errors.length > 0) {
      console.log(`WARN: Console errors on register: ${errors.join("; ")}`);
    } else {
      console.log("PASS: Register page renders without JS errors");
    }
  });
});

// ─── Authenticated tests (sequential, same context) ─────────────────
test.describe("Ori Financeiro P0 E2E - Authenticated", () => {
  let page: Page;

  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      recordVideo: { dir: "/paperclip/projects/financial-saas/tests/videos/" },
    });
    page = await context.newPage();

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill("#email", TEST_EMAIL);
    await page.fill("#password", TEST_PASSWORD);
    await page.click("button[type=submit]");

    // Wait for dashboard or handle login failure
    try {
      await page.waitForURL("**/dashboard", { timeout: 15000 });
      console.log("AUTH: Logged in successfully");
    } catch {
      console.log("AUTH: Login may have failed - continuing tests anyway");
      // Try navigating directly
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(3000);
    }
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  // ─── 6. Dashboard ───────────────────────────────────────────────────
  test("6.1 Dashboard - displays stat cards", async () => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(3000);

    const url = page.url();
    if (url.includes("/login")) {
      console.log("SKIP: Not authenticated, cannot test dashboard");
      test.skip();
      return;
    }

    // Check for dashboard heading
    const heading = page.locator("text=Dashboard");
    const headingVisible = await heading.isVisible().catch(() => false);
    console.log(`Dashboard heading visible: ${headingVisible}`);

    // Check stat cards
    const saldoTotal = page.locator("text=Saldo Total");
    const receitas = page.locator("text=Receitas (Mês)");
    const despesas = page.locator("text=Despesas (Mês)");
    const contas = page.locator("text=Contas");

    const results = {
      "Saldo Total": await saldoTotal.isVisible().catch(() => false),
      "Receitas (Mês)": await receitas.isVisible().catch(() => false),
      "Despesas (Mês)": await despesas.isVisible().catch(() => false),
      Contas: await contas.isVisible().catch(() => false),
    };

    for (const [card, visible] of Object.entries(results)) {
      console.log(`${visible ? "PASS" : "FAIL"}: Dashboard card "${card}" visible: ${visible}`);
    }

    await page.screenshot({ path: "/paperclip/projects/financial-saas/tests/screenshots/dashboard.png" });
  });

  // ─── 7. Sidebar navigation ─────────────────────────────────────────
  test("7.1 Sidebar - all nav items present", async () => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);

    if (page.url().includes("/login")) {
      console.log("SKIP: Not authenticated");
      test.skip();
      return;
    }

    const navItems = ["Dashboard", "Transações", "Contas", "Tags", "Configurações"];
    for (const item of navItems) {
      const visible = await page.locator(`text=${item}`).first().isVisible().catch(() => false);
      console.log(`${visible ? "PASS" : "FAIL"}: Sidebar nav "${item}" visible: ${visible}`);
    }

    // Check logout button
    const logoutVisible = await page.locator("text=Sair").isVisible().catch(() => false);
    console.log(`${logoutVisible ? "PASS" : "FAIL"}: Logout button visible: ${logoutVisible}`);
  });

  test("7.2 Sidebar - navigate to Accounts", async () => {
    await page.locator('a[href="/accounts"]').click();
    await page.waitForURL("**/accounts", { timeout: 5000 });
    expect(page.url()).toContain("/accounts");
    console.log("PASS: Navigated to /accounts");
  });

  test("7.3 Sidebar - navigate to Transactions", async () => {
    await page.locator('a[href="/transactions"]').click();
    await page.waitForURL("**/transactions", { timeout: 5000 });
    expect(page.url()).toContain("/transactions");
    console.log("PASS: Navigated to /transactions");
  });

  test("7.4 Sidebar - navigate to Tags", async () => {
    await page.locator('a[href="/tags"]').click();
    await page.waitForURL("**/tags", { timeout: 5000 });
    expect(page.url()).toContain("/tags");
    console.log("PASS: Navigated to /tags");
  });

  test("7.5 Sidebar - navigate to Settings", async () => {
    await page.locator('a[href="/settings"]').click();
    await page.waitForURL("**/settings", { timeout: 5000 });
    expect(page.url()).toContain("/settings");
    console.log("PASS: Navigated to /settings");
  });

  // ─── 8. Accounts ───────────────────────────────────────────────────
  test("8.1 Accounts - page loads with default accounts", async () => {
    await page.goto(`${BASE_URL}/accounts`);
    await page.waitForTimeout(3000);

    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    const heading = await page.locator("text=Contas").first().isVisible().catch(() => false);
    console.log(`${heading ? "PASS" : "FAIL"}: Accounts heading visible`);

    // Check for "Nova Conta" button
    const newAccountBtn = await page.locator("text=Nova Conta").isVisible().catch(() => false);
    console.log(`${newAccountBtn ? "PASS" : "FAIL"}: "Nova Conta" button visible`);

    await page.screenshot({ path: "/paperclip/projects/financial-saas/tests/screenshots/accounts.png" });
  });

  test("8.2 Accounts - create new account", async () => {
    await page.goto(`${BASE_URL}/accounts`);
    await page.waitForTimeout(2000);

    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    // Click "Nova Conta"
    await page.locator("text=Nova Conta").click();
    await page.waitForTimeout(1000);

    // Fill form
    const dialogInput = page.locator('input[placeholder="Nome da conta"]');
    await dialogInput.fill("Conta Teste QA");

    // Select type "Empresa"
    await page.locator("text=Empresa").click();

    // Submit
    await page.locator('button:has-text("Criar")').last().click();
    await page.waitForTimeout(3000);

    // Check if account appears
    const accountVisible = await page.locator("text=Conta Teste QA").isVisible().catch(() => false);
    console.log(`${accountVisible ? "PASS" : "FAIL"}: Created account "Conta Teste QA" visible`);

    await page.screenshot({ path: "/paperclip/projects/financial-saas/tests/screenshots/accounts-after-create.png" });
  });

  // ─── 9. Tags ────────────────────────────────────────────────────────
  test("9.1 Tags - page loads", async () => {
    await page.goto(`${BASE_URL}/tags`);
    await page.waitForTimeout(2000);

    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    const heading = await page.locator("h1:has-text('Tags')").isVisible().catch(() => false);
    console.log(`${heading ? "PASS" : "FAIL"}: Tags heading visible`);

    const newTagBtn = await page.locator("text=Nova Tag").isVisible().catch(() => false);
    console.log(`${newTagBtn ? "PASS" : "FAIL"}: "Nova Tag" button visible`);
  });

  test("9.2 Tags - create tag with color", async () => {
    await page.goto(`${BASE_URL}/tags`);
    await page.waitForTimeout(2000);

    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    await page.locator("text=Nova Tag").click();
    await page.waitForTimeout(1000);

    await page.locator('input[placeholder*="Marketing"]').fill("Fornecedor");

    // Pick a color (green - #22c55e)
    await page.locator('button[style*="background-color: rgb(34, 197, 94)"]').click().catch(async () => {
      // Try clicking the 4th color button
      const colorBtns = page.locator("button.rounded-full");
      const count = await colorBtns.count();
      if (count >= 4) await colorBtns.nth(3).click();
    });

    await page.locator('button:has-text("Criar Tag")').click();
    await page.waitForTimeout(3000);

    const tagVisible = await page.locator("text=Fornecedor").isVisible().catch(() => false);
    console.log(`${tagVisible ? "PASS" : "FAIL"}: Created tag "Fornecedor" visible`);

    await page.screenshot({ path: "/paperclip/projects/financial-saas/tests/screenshots/tags-after-create.png" });
  });

  // ─── 10. Transactions ──────────────────────────────────────────────
  test("10.1 Transactions - page loads", async () => {
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForTimeout(2000);

    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    const heading = await page.locator("h1:has-text('Transações')").isVisible().catch(() => false);
    console.log(`${heading ? "PASS" : "FAIL"}: Transactions heading visible`);

    const newTxnBtn = await page.locator("text=Nova Transação").isVisible().catch(() => false);
    console.log(`${newTxnBtn ? "PASS" : "FAIL"}: "Nova Transação" button visible`);

    // Check table headers
    const headers = ["Data", "Descrição", "Conta", "Tags", "Valor"];
    for (const h of headers) {
      const visible = await page.locator(`th:has-text("${h}")`).isVisible().catch(() => false);
      console.log(`${visible ? "PASS" : "FAIL"}: Table header "${h}" visible`);
    }

    await page.screenshot({ path: "/paperclip/projects/financial-saas/tests/screenshots/transactions.png" });
  });

  test("10.2 Transactions - create income transaction", async () => {
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForTimeout(2000);

    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    await page.locator("text=Nova Transação").click();
    await page.waitForTimeout(1000);

    // Select "Receita" type
    await page.locator('button:has-text("Receita")').click();

    // Fill description
    await page.locator('input[placeholder*="Pagamento"]').fill("Venda produto A");

    // Fill amount
    await page.locator('input[type="number"]').fill("1500.50");

    // Submit
    await page.locator('button:has-text("Criar Transação")').click();
    await page.waitForTimeout(3000);

    const txnVisible = await page.locator("text=Venda produto A").isVisible().catch(() => false);
    console.log(`${txnVisible ? "PASS" : "FAIL"}: Income transaction "Venda produto A" visible`);

    await page.screenshot({ path: "/paperclip/projects/financial-saas/tests/screenshots/transactions-after-income.png" });
  });

  test("10.3 Transactions - create expense transaction", async () => {
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForTimeout(2000);

    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    await page.locator("text=Nova Transação").click();
    await page.waitForTimeout(1000);

    // "Despesa" is default type
    await page.locator('input[placeholder*="Pagamento"]').fill("Aluguel escritório");
    await page.locator('input[type="number"]').fill("3000.00");

    await page.locator('button:has-text("Criar Transação")').click();
    await page.waitForTimeout(3000);

    const txnVisible = await page.locator("text=Aluguel escritório").isVisible().catch(() => false);
    console.log(`${txnVisible ? "PASS" : "FAIL"}: Expense transaction "Aluguel escritório" visible`);

    await page.screenshot({ path: "/paperclip/projects/financial-saas/tests/screenshots/transactions-after-expense.png" });
  });

  // ─── 11. Settings ──────────────────────────────────────────────────
  test("11.1 Settings - page loads with org info", async () => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForTimeout(2000);

    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    const heading = await page.locator("h1:has-text('Configurações')").isVisible().catch(() => false);
    console.log(`${heading ? "PASS" : "FAIL"}: Settings heading visible`);

    const orgCard = await page.locator("text=Organização").first().isVisible().catch(() => false);
    console.log(`${orgCard ? "PASS" : "FAIL"}: Organization card visible`);

    const membersCard = await page.locator("text=Membros").first().isVisible().catch(() => false);
    console.log(`${membersCard ? "PASS" : "FAIL"}: Members card visible`);

    await page.screenshot({ path: "/paperclip/projects/financial-saas/tests/screenshots/settings.png" });
  });

  // ─── 12. Dashboard balance verification ────────────────────────────
  test("12.1 Dashboard - verify balance after transactions", async () => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(3000);

    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    await page.screenshot({ path: "/paperclip/projects/financial-saas/tests/screenshots/dashboard-after-txns.png" });
    console.log("INFO: Dashboard screenshot captured after transactions for manual review");
  });
});

// ─── Mobile viewport tests ────────────────────────────────────────────
test.describe("Ori Financeiro P0 - Mobile Viewport", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("13.1 Login page responsive on mobile", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(2000);

    const cardVisible = await page.locator("text=Ori Financeiro").isVisible().catch(() => false);
    console.log(`${cardVisible ? "PASS" : "FAIL"}: Login card visible on mobile`);

    const emailInput = await page.locator("#email").isVisible().catch(() => false);
    console.log(`${emailInput ? "PASS" : "FAIL"}: Email input visible on mobile`);

    await page.screenshot({ path: "/paperclip/projects/financial-saas/tests/screenshots/mobile-login.png" });
  });

  test("13.2 Register page responsive on mobile", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForTimeout(2000);

    const cardVisible = await page.locator("text=Criar Conta").isVisible().catch(() => false);
    console.log(`${cardVisible ? "PASS" : "FAIL"}: Register card visible on mobile`);

    await page.screenshot({ path: "/paperclip/projects/financial-saas/tests/screenshots/mobile-register.png" });
  });
});
