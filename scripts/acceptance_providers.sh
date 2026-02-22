#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000}
TMP_DIR=$(mktemp -d)
COOKIE_JAR="$TMP_DIR/cookies.txt"
MEDIA_ID=""
PROVIDER_ID=""

echo "== Provider acceptance smoke =="

echo "1) Signup provider"
signup_resp=$(curl -s -X POST "$BASE_URL/api/providers/signup" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d '{"name":"AngeBae","email":"angebae.provider@local","password":"Provider@123456","contact_info":{"phone":"+56 9 1234-5678"}}')
echo "$signup_resp" | jq .
PROVIDER_ID=$(echo "$signup_resp" | jq -r '.provider.id')

echo "2) Login provider"
login_resp=$(curl -s -X POST "$BASE_URL/api/providers/login" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d '{"email":"angebae.provider@local","password":"Provider@123456"}')
echo "$login_resp" | jq .
PROVIDER_ID=${PROVIDER_ID:-$(echo "$login_resp" | jq -r '.provider.id')}

echo "3) Upload sample media (pdf)"
echo "dummy pdf" > "$TMP_DIR/sample.pdf"
upload_resp=$(curl -s -X POST "$BASE_URL/api/media/upload" \
  -b "$COOKIE_JAR" \
  -F "file=@$TMP_DIR/sample.pdf;type=application/pdf" \
  -F "type=pdf" \
  -F "providerId=$PROVIDER_ID")
echo "$upload_resp" | jq .
MEDIA_ID=$(echo "$upload_resp" | jq -r '.media.id')

echo "4) Enqueue OCR job"
enqueue_resp=$(curl -s -X POST "$BASE_URL/api/ocr/enqueue" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR" \
  -d "{\"mediaId\":\"$MEDIA_ID\",\"provider_id\":\"$PROVIDER_ID\"}")
echo "$enqueue_resp" | jq .
JOB_ID=$(echo "$enqueue_resp" | jq -r '.ocrJob.id')

echo "5) Poll OCR job"
for i in {1..10}; do
  job_resp=$(curl -s "$BASE_URL/api/ocr/jobs/$JOB_ID" -b "$COOKIE_JAR")
  status=$(echo "$job_resp" | jq -r '.status')
  echo "Status: $status"
  if [[ "$status" == "done" || "$status" == "failed" ]]; then
    break
  fi
  sleep 2
done

echo "6) Public provider page"
curl -s "$BASE_URL/api/providers/by-slug/angebae" | jq .

echo "Done. Temp files at $TMP_DIR"
