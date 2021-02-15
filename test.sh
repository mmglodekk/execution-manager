#!/bin/bash

TASKS_COUNT=100
CONCURRENT_WORKERS=30

set -e
function assert {
  VALUE="${1}"
  EXPECTATION="${2}"
  ASSERTION="${3}"

  if [[ ${VALUE} != ${EXPECTATION} ]]; then
    echo "${ASSERTION} failed! (${VALUE} vs ${EXPECTATION})"
    exit 1
  fi
}

for i in $(seq 1 ${TASKS_COUNT}); do curl -Ss http://localhost:5000/resourceA/execute > /dev/null; done

curl -sS -d "{\"concurrency\":${CONCURRENT_WORKERS}}" \
  -H "Content-Type: application/json" \
  -X PUT http://localhost:5000/resourceA \
  > /dev/null

STATUS="$(curl -Ss http://localhost:5000/resourceA/status)"

sleep 5 # warmup

# Tested resource dependency
WORKERS="$(echo ${STATUS} | jq .activeWorkers)"
assert "${WORKERS}" "${CONCURRENT_WORKERS}" "Active workers"

BUSY="$(echo ${STATUS} | jq .busyWorkers)"
assert "${BUSY}" "${CONCURRENT_WORKERS}" "Busy workers"

PROCESSED="$(echo ${STATUS} | jq .processed)"
LEFT="$(echo ${STATUS} | jq .tasksLeft)"
TOTAL=$((${BUSY} + ${LEFT}))
assert "${TOTAL}" "${TASKS_COUNT}" "Total tasks count"

# Testing other resource dependency
OTHER_STATUS="$(curl -Ss http://localhost:5000/resourceB/status)"
assert "$(echo ${OTHER_STATUS} | jq .tasksLeft)" "0" "Other resource tasks count"
assert "$(echo ${OTHER_STATUS} | jq .processed)" "0" "Other resource processed"
assert "$(echo ${OTHER_STATUS} | jq .activeWorkers)" "5" "Other resource workers"

echo "Passed!"

