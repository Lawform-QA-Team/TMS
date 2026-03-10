#!/bin/bash

set -euo pipefail

# 이 스크립트 기준으로 프로젝트 루트 결정
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="test-scripts/performance/samsung/real"

cd "$ROOT_DIR"

echo "=============================================="
echo "[k6] Running all samsung/real scripts"
echo "ROOT_DIR: $ROOT_DIR"
echo "BASE_DIR: $BASE_DIR"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

# samsung/real 하위의 모든 .js 파일을 정렬된 순서로 순차 실행
find "$BASE_DIR" -type f -name "*.js" \
            ! -name "login_helper.js" \
            | sort | while read -r script; do
            echo "----------------------------------------------"
            echo "Running k6 script: $script"
            echo "Start: $(date -u '+%Y-%m-%d %H:%M:%S')"
            echo "----------------------------------------------"
            ./run.sh "$script"
            echo "Finished: $(date -u '+%Y-%m-%d %H:%M:%S')"
            echo "----------------------------------------------"
            echo
          done

echo "=============================================="
echo "[k6] All samsung/real scripts finished"
echo "End Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

