#!/usr/bin/env bash
# Manual smoke test for the Step 5 matching engine endpoints.
#
# Usage:
#   1. Start the backend: npm run dev:backend (from the repo root)
#   2. In another terminal: bash backend/test-matches.sh
#
# Creates two users (a "loser" and a "finder"), has one report a LOST
# wallet and the other report a matching FOUND wallet, runs the matching
# engine, and walks through fetching/accepting a match plus a handful of
# authorization/edge-case checks. Not a full test suite — a readable
# smoke test you can run after any change to confirm nothing obviously
# broke.

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
RANDOM_SUFFIX=$RANDOM$RANDOM
PASSWORD="password123"

LOSER_EMAIL="loser+${RANDOM_SUFFIX}@example.com"
FINDER_EMAIL="finder+${RANDOM_SUFFIX}@example.com"
OUTSIDER_EMAIL="outsider+${RANDOM_SUFFIX}@example.com"

echo "== 0. Register three test users (loser, finder, outsider) =="
register() {
  local email="$1"
  local name="$2"
  curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"$PASSWORD\"}" \
    | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}
LOSER_TOKEN=$(register "$LOSER_EMAIL" "Loser Test")
FINDER_TOKEN=$(register "$FINDER_EMAIL" "Finder Test")
OUTSIDER_TOKEN=$(register "$OUTSIDER_EMAIL" "Outsider Test")

if [ -z "$LOSER_TOKEN" ] || [ -z "$FINDER_TOKEN" ] || [ -z "$OUTSIDER_TOKEN" ]; then
  echo "❌ Could not register all test users."
  exit 1
fi
echo "✅ Three test users ready."
echo ""

echo "== 1. Create a LOST item (as loser) =="
LOST_RESPONSE=$(curl -s -X POST "$BASE_URL/api/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOSER_TOKEN" \
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
LOST_ID=$(echo "$LOST_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$LOST_ID" ]; then
  echo "❌ Could not create LOST item. Response:"
  echo "$LOST_RESPONSE"
  exit 1
fi
echo "✅ Created LOST item $LOST_ID"
echo ""

echo "== 2. Create a matching FOUND item (as finder) =="
FOUND_RESPONSE=$(curl -s -X POST "$BASE_URL/api/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FINDER_TOKEN" \
  -d '{
        "type": "FOUND",
        "name": "Wallet Black",
        "category": "WALLET",
        "description": "Found a black wallet with cards inside near the library",
        "location": "College Library",
        "city": "Chennai",
        "date": "2026-09-06",
        "additionalDetails": "Leather wallet, black",
        "identifyingCharacteristics": "Has a scratch on the front side"
      }')
FOUND_ID=$(echo "$FOUND_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$FOUND_ID" ]; then
  echo "❌ Could not create FOUND item. Response:"
  echo "$FOUND_RESPONSE"
  exit 1
fi
echo "✅ Created FOUND item $FOUND_ID"
echo ""

echo "== 3. POST /api/matches/run =="
RUN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/matches/run" \
  -H "Authorization: Bearer $LOSER_TOKEN")
echo "$RUN_RESPONSE"
echo ""
if ! echo "$RUN_RESPONSE" | grep -q '"success":true'; then
  echo "❌ Matching run failed."
  exit 1
fi
MATCH_ID=$(echo "$RUN_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$MATCH_ID" ]; then
  echo "❌ No match was created — expected the wallet pair to score >= 50."
  exit 1
fi
echo "✅ Matching run created/updated a match: $MATCH_ID"
echo ""

echo "== 4. POST /api/matches/run without a token (should be 401) =="
NO_AUTH_RUN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/matches/run")
echo "HTTP status: $NO_AUTH_RUN_STATUS"
if [ "$NO_AUTH_RUN_STATUS" != "401" ]; then
  echo "❌ Expected 401 without a token, got $NO_AUTH_RUN_STATUS"
  exit 1
fi
echo "✅ Correctly rejected with 401."
echo ""

echo "== 5. GET /api/matches (as loser — should include the new match) =="
LIST_RESPONSE=$(curl -s "$BASE_URL/api/matches" -H "Authorization: Bearer $LOSER_TOKEN")
echo "$LIST_RESPONSE" | head -c 800
echo ""
if ! echo "$LIST_RESPONSE" | grep -q "$MATCH_ID"; then
  echo "❌ Loser's match list did not include the new match."
  exit 1
fi
if echo "$LIST_RESPONSE" | grep -q 'passwordHash'; then
  echo "❌ SECURITY ISSUE: passwordHash leaked in match list!"
  exit 1
fi
echo "✅ Match list includes the new match, no passwordHash leaked."
echo ""

echo "== 6. GET /api/matches/:id (as finder — also involved) =="
GET_ONE_RESPONSE=$(curl -s "$BASE_URL/api/matches/$MATCH_ID" -H "Authorization: Bearer $FINDER_TOKEN")
echo "$GET_ONE_RESPONSE" | head -c 800
echo ""
if ! echo "$GET_ONE_RESPONSE" | grep -q '"success":true'; then
  echo "❌ Finder could not fetch the match they're involved in."
  exit 1
fi
echo "✅ Finder (the other involved party) can view the match."
echo ""

echo "== 7. GET /api/matches/:id (as outsider — should be 403) =="
OUTSIDER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/matches/$MATCH_ID" \
  -H "Authorization: Bearer $OUTSIDER_TOKEN")
echo "HTTP status: $OUTSIDER_STATUS"
if [ "$OUTSIDER_STATUS" != "403" ]; then
  echo "❌ Expected 403 for an unrelated user, got $OUTSIDER_STATUS"
  exit 1
fi
echo "✅ Correctly rejected unrelated user with 403."
echo ""

echo "== 8. GET /api/matches/:id with a bogus id (should be 404) =="
BOGUS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/matches/not-a-real-id" \
  -H "Authorization: Bearer $LOSER_TOKEN")
echo "HTTP status: $BOGUS_STATUS"
if [ "$BOGUS_STATUS" != "404" ]; then
  echo "❌ Expected 404 for a bogus match id, got $BOGUS_STATUS"
  exit 1
fi
echo "✅ Correctly returns 404 for an invalid match id."
echo ""

echo "== 9. PATCH /api/matches/:id/status as outsider (should be 403) =="
OUTSIDER_PATCH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/api/matches/$MATCH_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OUTSIDER_TOKEN" \
  -d '{"status":"ACCEPTED"}')
echo "HTTP status: $OUTSIDER_PATCH_STATUS"
if [ "$OUTSIDER_PATCH_STATUS" != "403" ]; then
  echo "❌ Expected 403 for an unrelated user, got $OUTSIDER_PATCH_STATUS"
  exit 1
fi
echo "✅ Correctly rejected unrelated user's status change with 403."
echo ""

echo "== 10. PATCH /api/matches/:id/status as loser (accept) =="
ACCEPT_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/matches/$MATCH_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOSER_TOKEN" \
  -d '{"status":"ACCEPTED"}')
echo "$ACCEPT_RESPONSE" | head -c 500
echo ""
if ! echo "$ACCEPT_RESPONSE" | grep -q '"ACCEPTED"'; then
  echo "❌ Accepting the match did not take effect."
  exit 1
fi
echo "✅ Match accepted."
echo ""

echo "== 11. PATCH /api/matches/:id/status again (already decided, should be 409) =="
ALREADY_DECIDED_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/api/matches/$MATCH_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOSER_TOKEN" \
  -d '{"status":"REJECTED"}')
echo "HTTP status: $ALREADY_DECIDED_STATUS"
if [ "$ALREADY_DECIDED_STATUS" != "409" ]; then
  echo "❌ Expected 409 for an already-decided match, got $ALREADY_DECIDED_STATUS"
  exit 1
fi
echo "✅ Correctly rejected re-deciding an already-decided match with 409."
echo ""

echo "== 12. POST /api/matches/run again (duplicate prevention check) =="
SECOND_RUN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/matches/run" -H "Authorization: Bearer $LOSER_TOKEN")
SECOND_RUN_MATCH_COUNT=$(echo "$SECOND_RUN_RESPONSE" | grep -o "\"id\":\"$MATCH_ID\"" | wc -l)
echo "Occurrences of the same match id in the second run's matches array: $SECOND_RUN_MATCH_COUNT"
if [ "$SECOND_RUN_MATCH_COUNT" -gt 1 ]; then
  echo "❌ The same lost/found pair produced more than one Match record."
  exit 1
fi
STATUS_AFTER_RERUN=$(curl -s "$BASE_URL/api/matches/$MATCH_ID" -H "Authorization: Bearer $LOSER_TOKEN" | grep -o '"status":"[^"]*"' | head -1)
if ! echo "$STATUS_AFTER_RERUN" | grep -q "ACCEPTED"; then
  echo "❌ Rerunning matching should not have reset the ACCEPTED status. Got: $STATUS_AFTER_RERUN"
  exit 1
fi
echo "✅ No duplicate Match record was created, and status stayed ACCEPTED after rerun."
echo ""

echo "🎉 All matching smoke tests passed."
