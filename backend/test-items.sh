#!/usr/bin/env bash
# Manual smoke test for the Step 4 item endpoints.
#
# Usage:
#   1. Start the backend: npm run dev:backend (from the repo root)
#   2. In another terminal: bash backend/test-items.sh
#
# Registers a throwaway user (reusing the Step 3 auth flow), then exercises
# create/list/get/my/update/status/delete for items. Not a full test suite
# — a readable smoke test you can run after any change to confirm nothing
# obviously broke.

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
RANDOM_SUFFIX=$RANDOM$RANDOM
EMAIL="itemtester+${RANDOM_SUFFIX}@example.com"
PASSWORD="password123"

echo "== 0. Register + login a test user =="
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Item Tester\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "❌ Could not register/authenticate test user. Response was:"
  echo "$REGISTER_RESPONSE"
  exit 1
fi
echo "✅ Test user ready."
echo ""

echo "== 1. POST /api/items (create a LOST item) =="
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
        "type": "LOST",
        "name": "Black Wallet",
        "category": "WALLET",
        "description": "Black leather wallet with three cards inside",
        "location": "College Library",
        "city": "Chennai",
        "date": "2026-09-05",
        "additionalDetails": "Small black leather wallet",
        "identifyingCharacteristics": "Scratch on the front"
      }')
echo "$CREATE_RESPONSE"
echo ""
if ! echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
  echo "❌ Item creation failed — stopping."
  exit 1
fi
ITEM_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ Created item $ITEM_ID"
echo ""

echo "== 2. GET /api/items (public list, filtered) =="
curl -s "$BASE_URL/api/items?type=LOST&category=WALLET&city=Chennai&page=1&limit=10" | head -c 1000
echo ""
echo ""

echo "== 3. GET /api/items?search=black wallet =="
curl -s "$BASE_URL/api/items?search=black%20wallet" | head -c 1000
echo ""
echo ""

echo "== 4. GET /api/items/:id =="
GET_ONE_RESPONSE=$(curl -s "$BASE_URL/api/items/$ITEM_ID")
echo "$GET_ONE_RESPONSE"
echo ""
if ! echo "$GET_ONE_RESPONSE" | grep -q '"success":true'; then
  echo "❌ Fetching single item failed."
  exit 1
fi
if echo "$GET_ONE_RESPONSE" | grep -q 'passwordHash'; then
  echo "❌ SECURITY ISSUE: passwordHash leaked in item response!"
  exit 1
fi
echo "✅ Single item fetched, no passwordHash leaked."
echo ""

echo "== 5. GET /api/items/my =="
MY_ITEMS_RESPONSE=$(curl -s "$BASE_URL/api/items/my?type=LOST" \
  -H "Authorization: Bearer $TOKEN")
echo "$MY_ITEMS_RESPONSE"
echo ""
if ! echo "$MY_ITEMS_RESPONSE" | grep -q '"success":true'; then
  echo "❌ /my failed."
  exit 1
fi
echo "✅ /my succeeded."
echo ""

echo "== 6. PUT /api/items/:id (owner update) =="
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/items/$ITEM_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"description":"Updated: black leather wallet, now with a torn corner"}')
echo "$UPDATE_RESPONSE"
echo ""
if ! echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
  echo "❌ Update failed."
  exit 1
fi
echo "✅ Update succeeded."
echo ""

echo "== 7. PATCH /api/items/:id/status (mark RECOVERED) =="
STATUS_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/items/$ITEM_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"RECOVERED"}')
echo "$STATUS_RESPONSE"
echo ""
if ! echo "$STATUS_RESPONSE" | grep -q '"RECOVERED"'; then
  echo "❌ Status update did not take effect."
  exit 1
fi
echo "✅ Status updated to RECOVERED."
echo ""

echo "== 8. PUT /api/items/:id with no auth token (should be 401) =="
NO_AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE_URL/api/items/$ITEM_ID" \
  -H "Content-Type: application/json" \
  -d '{"description":"should not work"}')
echo "HTTP status: $NO_AUTH_STATUS"
if [ "$NO_AUTH_STATUS" != "401" ]; then
  echo "❌ Expected 401 without a token, got $NO_AUTH_STATUS"
  exit 1
fi
echo "✅ Correctly rejected with 401."
echo ""

echo "== 9. DELETE /api/items/:id =="
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/items/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "$DELETE_RESPONSE"
echo ""
if ! echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
  echo "❌ Delete failed."
  exit 1
fi
echo "✅ Delete succeeded."
echo ""

echo "== 10. GET /api/items/:id after delete (should be 404) =="
AFTER_DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/items/$ITEM_ID")
echo "HTTP status: $AFTER_DELETE_STATUS"
if [ "$AFTER_DELETE_STATUS" != "404" ]; then
  echo "❌ Expected 404 after delete, got $AFTER_DELETE_STATUS"
  exit 1
fi
echo "✅ Correctly returns 404 after delete."
echo ""

echo "🎉 All item smoke tests passed."
