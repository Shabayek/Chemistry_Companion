#!/usr/bin/env bash
#
# Run the Playwright end-to-end tests in a sandbox where `npx playwright install` cannot download browsers.
#
# Usage (from anywhere):
#   ./scripts/e2e-sandbox.sh                      # all e2e tests
#   ./scripts/e2e-sandbox.sh tests/e2e/lab.spec.ts # a single spec
#   ./scripts/e2e-sandbox.sh --repeat-each=3      # any Playwright CLI options are passed through
#   npm run test:e2e:sandbox
#
# Browser lookup order:
#   1. $PLAYWRIGHT_CHROMIUM_EXECUTABLE, if set and executable
#   2. /tmp/chromium (left behind by a previous run)
#   3. Otherwise Chromium is fetched from the npm registry (@sparticuz/chromium, which packages a
#      headless Chromium build) into $CHROMIUM_TOOLS_DIR (default /tmp/chr) and unpacked to /tmp/chromium.
#      Only registry.npmjs.org needs to be reachable. Nothing is added to this project's dependencies.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS_DIR="${CHROMIUM_TOOLS_DIR:-/tmp/chr}"
SPARTICUZ_VERSION="${SPARTICUZ_CHROMIUM_VERSION:-153}"   # Chromium 153: verified with @playwright/test 1.64

log() { printf '\033[1;36m[e2e-sandbox]\033[0m %s\n' "$*"; }

chromium_works() { [ -n "${1:-}" ] && [ -x "$1" ] && "$1" --version >/dev/null 2>&1; }

CHROMIUM="${PLAYWRIGHT_CHROMIUM_EXECUTABLE:-}"
if ! chromium_works "$CHROMIUM"; then
  CHROMIUM="/tmp/chromium"
fi

if ! chromium_works "$CHROMIUM"; then
  log "No usable Chromium found; fetching @sparticuz/chromium@${SPARTICUZ_VERSION} from npm into ${TOOLS_DIR} ..."
  mkdir -p "$TOOLS_DIR"
  if [ ! -f "$TOOLS_DIR/node_modules/@sparticuz/chromium/package.json" ]; then
    [ -f "$TOOLS_DIR/package.json" ] || echo '{ "private": true }' > "$TOOLS_DIR/package.json"
    npm install --prefix "$TOOLS_DIR" --no-audit --no-fund --loglevel=error "@sparticuz/chromium@${SPARTICUZ_VERSION}"
  fi
  log "Unpacking Chromium ..."
  CHROMIUM="$(cd "$TOOLS_DIR" && node --input-type=module -e "import c from '@sparticuz/chromium'; process.stdout.write(await c.executablePath());")"
  if ! chromium_works "$CHROMIUM"; then
    log "ERROR: unpacked Chromium at '$CHROMIUM' does not start." >&2
    exit 1
  fi
fi

log "Using $("$CHROMIUM" --version) at $CHROMIUM"

cd "$PROJECT_DIR"
if [ ! -d node_modules/@playwright/test ]; then
  log "Installing project dependencies (npm install) ..."
  npm install --no-audit --no-fund --loglevel=error
fi

export PLAYWRIGHT_CHROMIUM_EXECUTABLE="$CHROMIUM"
exec npx playwright test "$@"
