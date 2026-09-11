#!/usr/bin/env bash
# Manual smoke test for the Step 3 auth endpoints.
#
# Usage:
#   1. Start the backend: npm run dev:backend (from the repo root)
#   2. In another terminal: bash backend/test-auth.sh
#
# This uses a randomized email each run so it can be re-run without
# hitting "email already exists". It only prints raw responses and does a
# couple of basic pass/fail greps — it's a smoke test, not a full test
# suite (see README for how to add real tests later).

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
RANDOM_SUFFIX=$RANDOM$RANDOM
EMAIL="testuser+${RANDOM_SUFFIX}@example.com"
PASSWORD="password123"
NAME="Test User"

echo "== 1. POST /api/auth/register =="
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$REGISTER_RESPONSE"
echo ""

if ! echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
  echo "❌ Registration failed — stopping."
  exit 1
fi

if echo "$REGISTER_RESPONSE" | grep -q 'passwordHash'; then
  echo "❌ SECURITY ISSUE: passwordHash was present in the register response!"
  exit 1
fi

TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "✅ Registered. Token acquired from register response."
echo ""

echo "== 2. POST /api/auth/login =="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$LOGIN_RESPONSE"
echo ""

if ! echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo "❌ Login failed — stopping."
  exit 1
fi
if echo "$LOGIN_RESPONSE" | grep -q 'passwordHash'; then
  echo "❌ SECURITY ISSUE: passwordHash was present in the login response!"
  exit 1
fi
echo "✅ Login succeeded."
echo ""

echo "== 3. GET /api/auth/me (with token) =="
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")
echo "$ME_RESPONSE"
echo ""

if ! echo "$ME_RESPONSE" | grep -q '"success":true'; then
  echo "❌ /me failed with a valid token — stopping."
  exit 1
fi
echo "✅ /me succeeded with a valid token."
echo ""

echo "== 4. GET /api/auth/me (no token — should be 401) =="
NO_TOKEN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/auth/me")
echo "HTTP status: $NO_TOKEN_STATUS"
if [ "$NO_TOKEN_STATUS" != "401" ]; then
  echo "❌ Expected 401 without a token, got $NO_TOKEN_STATUS"
  exit 1
fi
echo "✅ Correctly rejected with 401."
echo ""

echo "== 5. POST /api/auth/login with wrong password (should be 401) =="
WRONG_PW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"wrongpassword\"}")
echo "HTTP status: $WRONG_PW_STATUS"
if [ "$WRONG_PW_STATUS" != "401" ]; then
  echo "❌ Expected 401 for wrong password, got $WRONG_PW_STATUS"
  exit 1
fi
echo "✅ Correctly rejected with 401."
echo ""

echo "== 6. POST /api/auth/register with duplicate email (should be 409) =="
DUPLICATE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "HTTP status: $DUPLICATE_STATUS"
if [ "$DUPLICATE_STATUS" != "409" ]; then
  echo "❌ Expected 409 for duplicate email, got $DUPLICATE_STATUS"
  exit 1
fi
echo "✅ Correctly rejected with 409."
echo ""

echo "🎉 All auth smoke tests passed."
