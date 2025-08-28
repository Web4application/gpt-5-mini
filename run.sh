#!/bin/bash
set -euo pipefail

GET_DEPLOYMENTS_ENDPOINT="https://api.vercel.com/v6/deployments"
DELETE_DEPLOYMENTS_ENDPOINT="https://api.vercel.com/v13/deployments"

# Defaults
DRY_RUN=false
KEEP_LATEST=3  # Number of most recent deployments to keep

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true ;;
    --keep)
      shift
      KEEP_LATEST="$1"
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
  shift
done

# Fetch deployments
deployments=$(curl -s -X GET \
  "${GET_DEPLOYMENTS_ENDPOINT}/?projectId=${VERCEL_PROJECT_ID}&teamId=${VERCEL_ORG_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}")

# Sort deployments by creation date descending (latest first)
sorted_deployments=$(echo "$deployments" | jq -r --arg META_TAG "$META_TAG" '
  [.deployments[]
   | select(.meta.base_hash? | type == "string" and contains($META_TAG))
   | {uid: .uid, created: .created}] 
   | sort_by(.created) | reverse
   | map(.uid)')

# Apply "keep latest N" logic
deployments_to_delete=$(echo "$sorted_deployments" | jq -r --argjson keep "$KEEP_LATEST" '
  if length > $keep then .[$keep:] else [] end')

if [[ -z "$deployments_to_delete" || "$deployments_to_delete" == "[]" ]]; then
  echo "No deployments to delete. Keeping the latest $KEEP_LATEST deployments."
  exit 0
fi

echo "META_TAG: $META_TAG"
echo "Keeping latest $KEEP_LATEST deployments"
echo "Deployments to delete: $deployments_to_delete"

for uid in $(echo "$deployments_to_delete" | jq -r '.[]'); do
  if $DRY_RUN; then
    echo "[DRY-RUN] Would delete deployment $uid"
  else
    echo "Deleting deployment $uid"
    delete_url="${DELETE_DEPLOYMENTS_ENDPOINT}/${uid}?teamId=${VERCEL_ORG_ID}"
    status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
      "$delete_url" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}")

    if [[ "$status" == "200" || "$status" == "204" ]]; then
      echo "Deleted $uid ✅"
    else
      echo "Failed to delete $uid ❌ (HTTP $status)"
    fi
  fi
done

uvicorn server:app --reload --port 8000
