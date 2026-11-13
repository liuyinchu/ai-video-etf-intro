#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/opt/node@24/bin:$PATH
case "${1:-check}" in
 check) node node_modules/typescript/bin/tsc --noEmit; node scripts/validate.mjs ;;
 audio) node scripts/make-narration.mjs; node scripts/plan-score.mjs; node scripts/make-score.mjs; node scripts/mix.mjs ;;
 stills) node scripts/render.mjs --stills ;;
 render) node scripts/render.mjs; node scripts/finalize.mjs ;;
 studio) node node_modules/@remotion/cli/remotion-cli.js studio src/index.ts ;;
 *) echo "Usage: ./scripts/run.sh {check|audio|stills|render|studio}"; exit 2 ;;
esac
