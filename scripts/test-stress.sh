#!/usr/bin/env bash
#
# Run the unit/component tests under simulated slow-machine conditions to catch timing-sensitive tests.
#
#   ./scripts/test-stress.sh            # 3 runs, 3 busy processes, coverage on
#   RUNS=5 LOAD=4 ./scripts/test-stress.sh
#   ./scripts/test-stress.sh tests/routes.test.tsx   # extra args go to `vitest run`
#   npm run test:stress
#
# Vitest is pinned to one CPU core (taskset, Linux) that it shares with LOAD busy-loop processes, and coverage
# instrumentation is enabled as in `npm run check`. This reproduced the flaky route tests (1 s async
# timeout) that only failed on slow or busy machines. Without taskset the busy loops still add load, but less
# predictably.
set -uo pipefail

RUNS="${RUNS:-3}"
LOAD="${LOAD:-3}"
CORE="${CORE:-0}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$(mktemp -d "${TMPDIR:-/tmp}/cc-stress.XXXXXX")"
cd "$PROJECT_DIR"

log() { printf '\033[1;36m[test-stress]\033[0m %s\n' "$*"; }

PIN=()
if command -v taskset >/dev/null 2>&1; then PIN=(taskset -c "$CORE"); else log "taskset not found: running without CPU pinning"; fi

BUSY=()
cleanup() { for p in "${BUSY[@]:-}"; do [ -n "$p" ] && kill "$p" 2>/dev/null; done; }
trap cleanup EXIT INT TERM
for _ in $(seq 1 "$LOAD"); do
  if [ ${#PIN[@]} -gt 0 ]; then "${PIN[@]}" bash -c 'while :; do :; done' & else bash -c 'while :; do :; done' & fi
  BUSY+=("$!")
done

# Coverage thresholds are project-wide; when only some test files are run they cannot be met, so turn them off.
THRESHOLDS=()
if [ "$#" -gt 0 ]; then
  THRESHOLDS=(--coverage.thresholds.statements=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.lines=0)
fi

log "$RUNS run(s), $LOAD busy process(es)${PIN:+ on core $CORE}, coverage on. Logs: $OUT"
failed=0
for i in $(seq 1 "$RUNS"); do
  start=$(date +%s)
  "${PIN[@]}" npx vitest run --coverage --coverage.reportsDirectory="$OUT/coverage-$i" --reporter=verbose "${THRESHOLDS[@]}" "$@" > "$OUT/run-$i.log" 2>&1
  code=$?
  summary=$(sed 's/\x1b\[[0-9;]*m//g' "$OUT/run-$i.log" | grep -E '^ +Tests ' | tail -1 | sed 's/^ *//')
  log "run $i: exit $code, $(( $(date +%s) - start )) s, ${summary:-no summary}"
  if [ "$code" -ne 0 ]; then
    failed=$((failed + 1))
    sed 's/\x1b\[[0-9;]*m//g' "$OUT/run-$i.log" | grep -E '^ +× ' | sed 's/^/    /'
  fi
done

log "slowest tests (last run):"
sed 's/\x1b\[[0-9;]*m//g' "$OUT/run-$RUNS.log" | grep -E '✓ .* [0-9]+ms$' | awk '{t=$NF; sub("ms","",t); print t" ms  "$0}' \
  | sort -rn | head -5 | sed -E 's/ ✓ / /' | cut -c1-150 | sed 's/^/    /'

if [ "$failed" -gt 0 ]; then log "$failed of $RUNS run(s) failed"; exit 1; fi
log "all $RUNS runs passed"
