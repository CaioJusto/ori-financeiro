#!/bin/bash
# Ori Financeiro P0 - HTTP-level E2E Tests
# Since Playwright's Chromium can't run (missing system libraries),
# we validate at the HTTP level using curl.

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0
TOTAL=0

result() {
  TOTAL=$((TOTAL + 1))
  if [ "$1" = "PASS" ]; then
    PASS=$((PASS + 1))
    echo "  PASS: $2"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $2 -- $3"
  fi
}

echo "=========================================="
echo "Ori Financeiro P0 - HTTP E2E Test Suite"
echo "=========================================="
echo ""

# ─── 1. Auth Pages Load ────────────────────────────────
echo "--- 1. AUTH PAGES ---"

# 1.1 Login page returns 200 and has form
STATUS=$(curl -s -o /tmp/login.html -w "%{http_code}" "$BASE_URL/login")
if [ "$STATUS" = "200" ]; then
  result "PASS" "1.1 Login page returns 200"
else
  result "FAIL" "1.1 Login page returns 200" "Got $STATUS"
fi

# Check login page has key elements
if grep -q "Ori Financeiro" /tmp/login.html 2>/dev/null; then
  result "PASS" "1.2 Login page contains 'Ori Financeiro' title"
else
  result "FAIL" "1.2 Login page contains 'Ori Financeiro' title" "Not found in HTML"
fi

if grep -q 'id="email"' /tmp/login.html 2>/dev/null; then
  result "PASS" "1.3 Login page has email input"
else
  result "FAIL" "1.3 Login page has email input" "Not found in HTML"
fi

if grep -q 'id="password"' /tmp/login.html 2>/dev/null; then
  result "PASS" "1.4 Login page has password input"
else
  result "FAIL" "1.4 Login page has password input" "Not found in HTML"
fi

# 1.5 Register page returns 200
STATUS=$(curl -s -o /tmp/register.html -w "%{http_code}" "$BASE_URL/register")
if [ "$STATUS" = "200" ]; then
  result "PASS" "1.5 Register page returns 200"
else
  result "FAIL" "1.5 Register page returns 200" "Got $STATUS"
fi

# Check register page has key elements
if grep -q "Criar Conta" /tmp/register.html 2>/dev/null; then
  result "PASS" "1.6 Register page contains 'Criar Conta'"
else
  result "FAIL" "1.6 Register page contains 'Criar Conta'" "Not found"
fi

if grep -q 'id="orgName"' /tmp/register.html 2>/dev/null; then
  result "PASS" "1.7 Register page has orgName input"
else
  result "FAIL" "1.7 Register page has orgName input" "Not found"
fi

echo ""

# ─── 2. Auth Redirect ──────────────────────────────────
echo "--- 2. AUTH REDIRECT ---"

# 2.1 Unauthenticated request to dashboard should redirect to login
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "$BASE_URL/dashboard")
if [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ] || [ "$STATUS" = "301" ]; then
  result "PASS" "2.1 Dashboard redirects unauthenticated users ($STATUS)"
else
  # Follow redirect and check final URL
  FINAL_URL=$(curl -s -o /dev/null -w "%{url_effective}" -L "$BASE_URL/dashboard")
  if echo "$FINAL_URL" | grep -q "login"; then
    result "PASS" "2.1 Dashboard redirects to login (final: $FINAL_URL)"
  else
    result "FAIL" "2.1 Dashboard redirects unauthenticated users" "Got $STATUS, final: $FINAL_URL"
  fi
fi

# 2.2 Unauthenticated /accounts should redirect
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "$BASE_URL/accounts")
if [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ] || [ "$STATUS" = "301" ]; then
  result "PASS" "2.2 /accounts redirects unauthenticated ($STATUS)"
else
  FINAL_URL=$(curl -s -o /dev/null -w "%{url_effective}" -L "$BASE_URL/accounts")
  if echo "$FINAL_URL" | grep -q "login"; then
    result "PASS" "2.2 /accounts redirects to login"
  else
    result "FAIL" "2.2 /accounts redirects unauthenticated" "Got $STATUS"
  fi
fi

# 2.3 Unauthenticated /transactions should redirect
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "$BASE_URL/transactions")
if [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ] || [ "$STATUS" = "301" ]; then
  result "PASS" "2.3 /transactions redirects unauthenticated ($STATUS)"
else
  FINAL_URL=$(curl -s -o /dev/null -w "%{url_effective}" -L "$BASE_URL/transactions")
  if echo "$FINAL_URL" | grep -q "login"; then
    result "PASS" "2.3 /transactions redirects to login"
  else
    result "FAIL" "2.3 /transactions redirects unauthenticated" "Got $STATUS"
  fi
fi

# 2.4 Unauthenticated /tags should redirect
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "$BASE_URL/tags")
if [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ] || [ "$STATUS" = "301" ]; then
  result "PASS" "2.4 /tags redirects unauthenticated ($STATUS)"
else
  FINAL_URL=$(curl -s -o /dev/null -w "%{url_effective}" -L "$BASE_URL/tags")
  if echo "$FINAL_URL" | grep -q "login"; then
    result "PASS" "2.4 /tags redirects to login"
  else
    result "FAIL" "2.4 /tags redirects unauthenticated" "Got $STATUS"
  fi
fi

# 2.5 Unauthenticated /settings should redirect
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "$BASE_URL/settings")
if [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ] || [ "$STATUS" = "301" ]; then
  result "PASS" "2.5 /settings redirects unauthenticated ($STATUS)"
else
  FINAL_URL=$(curl -s -o /dev/null -w "%{url_effective}" -L "$BASE_URL/settings")
  if echo "$FINAL_URL" | grep -q "login"; then
    result "PASS" "2.5 /settings redirects to login"
  else
    result "FAIL" "2.5 /settings redirects unauthenticated" "Got $STATUS"
  fi
fi

echo ""

# ─── 3. Page Response Codes ────────────────────────────
echo "--- 3. PAGE RESPONSE (no 500s) ---"

for path in "/" "/login" "/register"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
  if [ "$STATUS" -lt 500 ]; then
    result "PASS" "3.x $path returns $STATUS (no server error)"
  else
    result "FAIL" "3.x $path returns 500+" "Got $STATUS"
  fi
done

echo ""

# ─── 4. Static Assets ──────────────────────────────────
echo "--- 4. STATIC ASSETS ---"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/favicon.ico")
if [ "$STATUS" = "200" ]; then
  result "PASS" "4.1 favicon.ico returns 200"
else
  result "FAIL" "4.1 favicon.ico returns 200" "Got $STATUS"
fi

echo ""

# ─── 5. API/Supabase Connectivity Check ────────────────
echo "--- 5. SUPABASE CONNECTIVITY ---"

SUPABASE_URL="https://pskvfegwnqdfbstqkpob.supabase.co"
SUPABASE_ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBza3ZmZWd3bnFkZmJzdHFrcG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTg0NTEsImV4cCI6MjA4NjEzNDQ1MX0.E-jT0A47OXd27oUQ4AU7QYrMNYXWi3N_kmSFghqBbJ4"

# 5.1 Supabase REST API reachable
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON")
if [ "$STATUS" -lt 500 ]; then
  result "PASS" "5.1 Supabase REST API reachable ($STATUS)"
else
  result "FAIL" "5.1 Supabase REST API reachable" "Got $STATUS"
fi

# 5.2 Supabase Auth endpoint reachable
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/auth/v1/settings" -H "apikey: $SUPABASE_ANON")
if [ "$STATUS" -lt 500 ]; then
  result "PASS" "5.2 Supabase Auth API reachable ($STATUS)"
else
  result "FAIL" "5.2 Supabase Auth API reachable" "Got $STATUS"
fi

# 5.3 Check tables exist (organizations)
BODY=$(curl -s "$SUPABASE_URL/rest/v1/organizations?select=id&limit=0" -H "apikey: $SUPABASE_ANON" -H "Authorization: Bearer $SUPABASE_ANON")
if echo "$BODY" | grep -q "^\["; then
  result "PASS" "5.3 Table 'organizations' exists and queryable"
else
  result "FAIL" "5.3 Table 'organizations' exists" "$BODY"
fi

# 5.4 Check tables exist (cash_accounts)
BODY=$(curl -s "$SUPABASE_URL/rest/v1/cash_accounts?select=id&limit=0" -H "apikey: $SUPABASE_ANON" -H "Authorization: Bearer $SUPABASE_ANON")
if echo "$BODY" | grep -q "^\["; then
  result "PASS" "5.4 Table 'cash_accounts' exists and queryable"
else
  result "FAIL" "5.4 Table 'cash_accounts' exists" "$BODY"
fi

# 5.5 Check tables exist (transactions)
BODY=$(curl -s "$SUPABASE_URL/rest/v1/transactions?select=id&limit=0" -H "apikey: $SUPABASE_ANON" -H "Authorization: Bearer $SUPABASE_ANON")
if echo "$BODY" | grep -q "^\["; then
  result "PASS" "5.5 Table 'transactions' exists and queryable"
else
  result "FAIL" "5.5 Table 'transactions' exists" "$BODY"
fi

# 5.6 Check tables exist (tags)
BODY=$(curl -s "$SUPABASE_URL/rest/v1/tags?select=id&limit=0" -H "apikey: $SUPABASE_ANON" -H "Authorization: Bearer $SUPABASE_ANON")
if echo "$BODY" | grep -q "^\["; then
  result "PASS" "5.6 Table 'tags' exists and queryable"
else
  result "FAIL" "5.6 Table 'tags' exists" "$BODY"
fi

# 5.7 Check tables exist (transaction_tags)
BODY=$(curl -s "$SUPABASE_URL/rest/v1/transaction_tags?select=transaction_id&limit=0" -H "apikey: $SUPABASE_ANON" -H "Authorization: Bearer $SUPABASE_ANON")
if echo "$BODY" | grep -q "^\["; then
  result "PASS" "5.7 Table 'transaction_tags' exists and queryable"
else
  result "FAIL" "5.7 Table 'transaction_tags' exists" "$BODY"
fi

# 5.8 Check tables exist (org_members)
BODY=$(curl -s "$SUPABASE_URL/rest/v1/org_members?select=id&limit=0" -H "apikey: $SUPABASE_ANON" -H "Authorization: Bearer $SUPABASE_ANON")
if echo "$BODY" | grep -q "^\["; then
  result "PASS" "5.8 Table 'org_members' exists and queryable"
else
  result "FAIL" "5.8 Table 'org_members' exists" "$BODY"
fi

echo ""

# ─── 6. Auth API Flow ──────────────────────────────────
echo "--- 6. AUTH API FLOW ---"

TEST_EMAIL="qa-e2e-$(date +%s)@oritest.com"
TEST_PASSWORD="TestPass123!"
TEST_ORG="QA Auto Org"

# 6.1 Sign up a new user via Supabase Auth
SIGNUP_RESP=$(curl -s "$SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $SUPABASE_ANON" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

USER_ID=$(echo "$SIGNUP_RESP" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.id||d.user?.id||'')}catch{console.log('')}")

if [ -n "$USER_ID" ] && [ "$USER_ID" != "undefined" ] && [ "$USER_ID" != "null" ]; then
  result "PASS" "6.1 Sign up new user ($TEST_EMAIL) -> id=$USER_ID"
else
  result "FAIL" "6.1 Sign up new user" "Response: $(echo $SIGNUP_RESP | head -c 200)"
  USER_ID=""
fi

# 6.2 Sign in
if [ -n "$USER_ID" ]; then
  LOGIN_RESP=$(curl -s "$SUPABASE_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $SUPABASE_ANON" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

  ACCESS_TOKEN=$(echo "$LOGIN_RESP" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.access_token||'')}catch{console.log('')}")

  if [ -n "$ACCESS_TOKEN" ] && [ ${#ACCESS_TOKEN} -gt 10 ]; then
    result "PASS" "6.2 Sign in returns access_token"
  else
    result "FAIL" "6.2 Sign in" "No token returned: $(echo $LOGIN_RESP | head -c 200)"
    ACCESS_TOKEN=""
  fi
else
  result "FAIL" "6.2 Sign in (skipped, no user)"
  ACCESS_TOKEN=""
fi

echo ""

# ─── 7. CRUD via Supabase (authenticated) ──────────────
echo "--- 7. CRUD VIA SUPABASE API ---"

if [ -n "$ACCESS_TOKEN" ]; then
  AUTH_HEADER="Bearer $ACCESS_TOKEN"

  # 7.1 Create organization
  ORG_RESP=$(curl -s "$SUPABASE_URL/rest/v1/organizations" \
    -H "apikey: $SUPABASE_ANON" \
    -H "Authorization: $AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "{\"name\":\"$TEST_ORG\",\"slug\":\"qa-auto-org-$(date +%s)\"}")

  ORG_ID=$(echo "$ORG_RESP" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const o=Array.isArray(d)?d[0]:d;console.log(o?.id||'')}catch{console.log('')}")

  if [ -n "$ORG_ID" ] && [ "$ORG_ID" != "undefined" ]; then
    result "PASS" "7.1 Create organization '$TEST_ORG' -> id=$ORG_ID"
  else
    result "FAIL" "7.1 Create organization" "$(echo $ORG_RESP | head -c 200)"
    ORG_ID=""
  fi

  # 7.2 Add user as org member
  if [ -n "$ORG_ID" ]; then
    MEMBER_RESP=$(curl -s "$SUPABASE_URL/rest/v1/org_members" \
      -H "apikey: $SUPABASE_ANON" \
      -H "Authorization: $AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=representation" \
      -d "{\"organization_id\":\"$ORG_ID\",\"user_id\":\"$USER_ID\",\"role\":\"owner\"}")

    if echo "$MEMBER_RESP" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));process.exit(d.code?1:0)}catch{process.exit(0)}" 2>/dev/null; then
      result "PASS" "7.2 Add user as org owner"
    else
      result "FAIL" "7.2 Add user as org member" "$(echo $MEMBER_RESP | head -c 200)"
    fi
  fi

  # 7.3 Create cash accounts (3 types)
  if [ -n "$ORG_ID" ]; then
    for TYPE_NAME in "personal:Meu Caixa" "company:Caixa Empresa" "cash2:Caixa 2"; do
      TYPE="${TYPE_NAME%%:*}"
      NAME="${TYPE_NAME#*:}"
      ACCT_RESP=$(curl -s "$SUPABASE_URL/rest/v1/cash_accounts" \
        -H "apikey: $SUPABASE_ANON" \
        -H "Authorization: $AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d "{\"organization_id\":\"$ORG_ID\",\"name\":\"$NAME\",\"type\":\"$TYPE\"}")

      ACCT_ID=$(echo "$ACCT_RESP" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const o=Array.isArray(d)?d[0]:d;console.log(o?.id||'')}catch{console.log('')}")

      if [ -n "$ACCT_ID" ] && [ "$ACCT_ID" != "undefined" ]; then
        result "PASS" "7.3 Create account '$NAME' ($TYPE) -> id=$ACCT_ID"
        # Save first account id for transactions
        if [ "$TYPE" = "personal" ]; then
          FIRST_ACCT_ID="$ACCT_ID"
        fi
      else
        result "FAIL" "7.3 Create account '$NAME' ($TYPE)" "$(echo $ACCT_RESP | head -c 200)"
      fi
    done
  fi

  # 7.4 Create a tag
  if [ -n "$ORG_ID" ]; then
    TAG_RESP=$(curl -s "$SUPABASE_URL/rest/v1/tags" \
      -H "apikey: $SUPABASE_ANON" \
      -H "Authorization: $AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=representation" \
      -d "{\"organization_id\":\"$ORG_ID\",\"name\":\"Marketing\",\"color\":\"#3b82f6\"}")

    TAG_ID=$(echo "$TAG_RESP" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const o=Array.isArray(d)?d[0]:d;console.log(o?.id||'')}catch{console.log('')}")

    if [ -n "$TAG_ID" ] && [ "$TAG_ID" != "undefined" ]; then
      result "PASS" "7.4 Create tag 'Marketing' -> id=$TAG_ID"
    else
      result "FAIL" "7.4 Create tag" "$(echo $TAG_RESP | head -c 200)"
      TAG_ID=""
    fi
  fi

  # 7.5 Create income transaction
  if [ -n "$ORG_ID" ] && [ -n "$FIRST_ACCT_ID" ]; then
    TXN_RESP=$(curl -s "$SUPABASE_URL/rest/v1/transactions" \
      -H "apikey: $SUPABASE_ANON" \
      -H "Authorization: $AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=representation" \
      -d "{\"organization_id\":\"$ORG_ID\",\"cash_account_id\":\"$FIRST_ACCT_ID\",\"amount\":150050,\"type\":\"income\",\"description\":\"Venda produto A\",\"date\":\"$(date +%Y-%m-%d)\",\"created_by\":\"$USER_ID\"}")

    TXN_ID=$(echo "$TXN_RESP" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const o=Array.isArray(d)?d[0]:d;console.log(o?.id||'')}catch{console.log('')}")

    if [ -n "$TXN_ID" ] && [ "$TXN_ID" != "undefined" ]; then
      result "PASS" "7.5 Create income transaction -> id=$TXN_ID"
    else
      result "FAIL" "7.5 Create income transaction" "$(echo $TXN_RESP | head -c 200)"
      TXN_ID=""
    fi
  fi

  # 7.6 Create expense transaction
  if [ -n "$ORG_ID" ] && [ -n "$FIRST_ACCT_ID" ]; then
    TXN2_RESP=$(curl -s "$SUPABASE_URL/rest/v1/transactions" \
      -H "apikey: $SUPABASE_ANON" \
      -H "Authorization: $AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=representation" \
      -d "{\"organization_id\":\"$ORG_ID\",\"cash_account_id\":\"$FIRST_ACCT_ID\",\"amount\":-300000,\"type\":\"expense\",\"description\":\"Aluguel escritório\",\"date\":\"$(date +%Y-%m-%d)\",\"created_by\":\"$USER_ID\"}")

    TXN2_ID=$(echo "$TXN2_RESP" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const o=Array.isArray(d)?d[0]:d;console.log(o?.id||'')}catch{console.log('')}")

    if [ -n "$TXN2_ID" ] && [ "$TXN2_ID" != "undefined" ]; then
      result "PASS" "7.6 Create expense transaction -> id=$TXN2_ID"
    else
      result "FAIL" "7.6 Create expense transaction" "$(echo $TXN2_RESP | head -c 200)"
    fi
  fi

  # 7.7 Tag a transaction
  if [ -n "$TXN_ID" ] && [ -n "$TAG_ID" ]; then
    TT_RESP=$(curl -s "$SUPABASE_URL/rest/v1/transaction_tags" \
      -H "apikey: $SUPABASE_ANON" \
      -H "Authorization: $AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=representation" \
      -d "{\"transaction_id\":\"$TXN_ID\",\"tag_id\":\"$TAG_ID\"}")

    if echo "$TT_RESP" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));process.exit(d.code?1:0)}catch{process.exit(0)}" 2>/dev/null; then
      result "PASS" "7.7 Tag transaction with 'Marketing'"
    else
      result "FAIL" "7.7 Tag transaction" "$(echo $TT_RESP | head -c 200)"
    fi
  fi

  # 7.8 Read transactions (verify they exist)
  if [ -n "$ORG_ID" ]; then
    LIST_RESP=$(curl -s "$SUPABASE_URL/rest/v1/transactions?organization_id=eq.$ORG_ID&select=id,description,amount,type" \
      -H "apikey: $SUPABASE_ANON" \
      -H "Authorization: $AUTH_HEADER")

    COUNT=$(echo "$LIST_RESP" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(Array.isArray(d)?d.length:0)}catch{console.log(0)}")

    if [ "$COUNT" -ge 2 ]; then
      result "PASS" "7.8 Read transactions: $COUNT found"
    else
      result "FAIL" "7.8 Read transactions" "Expected >= 2, got $COUNT"
    fi
  fi

  # 7.9 Read accounts with balances
  if [ -n "$ORG_ID" ]; then
    ACCTS_RESP=$(curl -s "$SUPABASE_URL/rest/v1/cash_accounts?organization_id=eq.$ORG_ID&select=id,name,type,balance" \
      -H "apikey: $SUPABASE_ANON" \
      -H "Authorization: $AUTH_HEADER")

    ACCT_COUNT=$(echo "$ACCTS_RESP" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(Array.isArray(d)?d.length:0)}catch{console.log(0)}")

    if [ "$ACCT_COUNT" -ge 3 ]; then
      result "PASS" "7.9 Read accounts: $ACCT_COUNT found (personal, company, cash2)"
    else
      result "FAIL" "7.9 Read accounts" "Expected >= 3, got $ACCT_COUNT"
    fi
  fi

else
  echo "  SKIP: All CRUD tests skipped (no auth token)"
fi

echo ""

# ─── 8. HTML Content Checks ────────────────────────────
echo "--- 8. HTML/JS BUNDLE ---"

# Check that the login page includes the JS bundle
if grep -q "_next" /tmp/login.html 2>/dev/null; then
  result "PASS" "8.1 Login page includes Next.js bundle reference"
else
  result "FAIL" "8.1 Login page includes Next.js bundle" "No _next reference found"
fi

# Check register page has org name field reference
if grep -q "orgName" /tmp/register.html 2>/dev/null; then
  result "PASS" "8.2 Register page references orgName field"
else
  result "FAIL" "8.2 Register page references orgName field" "Not found"
fi

echo ""

# ─── Summary ───────────────────────────────────────────
echo "=========================================="
echo "RESULTS: $PASS passed, $FAIL failed, $TOTAL total"
echo "=========================================="
