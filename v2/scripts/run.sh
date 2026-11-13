#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/opt/node@24/bin:$PATH
case "${1:-check}" in
 data) node scripts/prepare-charts.mjs ;;
 audio) node scripts/make-narration.mjs; node scripts/plan-score.mjs; node scripts/make-score.mjs; node scripts/mix.mjs; node scripts/measure-audio.mjs ;;
 check) node node_modules/typescript/bin/tsc --noEmit; node scripts/validate.mjs ;;
 stills) node scripts/render.mjs --stills --silent; node scripts/render.mjs --contact --silent ;;
 render) node scripts/render.mjs; node scripts/finalize.mjs ;;
 *) echo "Usage: ./scripts/run.sh {data|audio|check|stills|render}"; exit 2 ;;
esac
