#!/bin/bash

# 로컬 MySQL 데이터베이스 백업(추출) 스크립트
# 다른 로컬 PC로 마이그레이션할 때 이 스크립트로 덤프 파일을 생성한 뒤,
# 해당 파일을 복사하여 대상 PC에서 restore 스크립트로 복원합니다.

set -e

# 환경 변수로 덮어쓸 수 있음 (없으면 기본값 사용)
DB_NAME="${DB_NAME:-test_management}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-1q2w#E\$R}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"

BACKUP_DIR="mysql-backup"
# 인자로 파일명 지정 가능. 없으면 local_backup.sql + 타임스탬프 백업 생성
OUTPUT_NAME="${1:-local_backup.sql}"
TIMESTAMP_BACKUP="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql"

# 비밀번호를 명령줄에 넘기지 않기 위해 임시 설정 파일 사용 (경고 제거 + 보안)
MYSQL_CNF=$(mktemp)
chmod 600 "$MYSQL_CNF"
cat > "$MYSQL_CNF" << EOF
[client]
user=$DB_USER
password=$DB_PASSWORD
host=$DB_HOST
port=$DB_PORT
EOF
trap 'rm -f "$MYSQL_CNF"' EXIT

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "📤 로컬 MySQL 데이터베이스 백업(추출) 시작..."
echo ""

# MySQL 명령어 경로 확인
MYSQL_CMD="mysql"
MYSQLDUMP_CMD="mysqldump"
if [ -f "/opt/homebrew/bin/mysql" ]; then
    MYSQL_CMD="/opt/homebrew/bin/mysql"
    MYSQLDUMP_CMD="/opt/homebrew/bin/mysqldump"
elif [ -f "/usr/local/bin/mysql" ]; then
    MYSQL_CMD="/usr/local/bin/mysql"
    MYSQLDUMP_CMD="/usr/local/bin/mysqldump"
fi

if ! command -v "$MYSQLDUMP_CMD" &> /dev/null; then
    echo -e "${RED}❌ mysqldump를 찾을 수 없습니다. MySQL 클라이언트가 설치되어 있는지 확인하세요.${NC}"
    exit 1
fi

# MySQL 연결 테스트
echo "🔍 MySQL 연결 테스트 중..."
if ! "$MYSQL_CMD" --defaults-extra-file="$MYSQL_CNF" -e "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}❌ MySQL 연결 실패 (호스트: $DB_HOST:$DB_PORT, 사용자: $DB_USER)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ MySQL 연결 성공${NC}"

# 대상 DB 존재 여부 확인
if ! "$MYSQL_CMD" --defaults-extra-file="$MYSQL_CNF" -e "USE $DB_NAME" > /dev/null 2>&1; then
    echo -e "${RED}❌ 데이터베이스 '$DB_NAME'가 없습니다.${NC}"
    exit 1
fi

# 백업 디렉터리 생성
mkdir -p "$BACKUP_DIR"

# 출력 경로: 인자가 있으면 그 이름으로, 없으면 local_backup.sql
OUTPUT_FILE="${BACKUP_DIR}/${OUTPUT_NAME}"
echo ""
echo "📦 덤프 생성 중: $OUTPUT_FILE"
echo "   (스키마 + 데이터, utf8mb4, 단일 트랜잭션)"

"$MYSQLDUMP_CMD" --defaults-extra-file="$MYSQL_CNF" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --set-charset \
    --default-character-set=utf8mb4 \
    "$DB_NAME" > "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 백업 완료: $OUTPUT_FILE${NC}"
    echo "   파일 크기: $(ls -lh "$OUTPUT_FILE" | awk '{print $5}')"
    # 인자 없이 실행한 경우 타임스탬프 백업도 생성 (기존 local_backup.sql 덮어쓰기 방지 + 이력 보관)
    if [ -z "${1:-}" ]; then
        cp "$OUTPUT_FILE" "$TIMESTAMP_BACKUP"
        echo -e "${GREEN}✅ 타임스탬프 백업 생성: $TIMESTAMP_BACKUP${NC}"
    fi
else
    echo -e "${RED}❌ 백업 실패${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 백업 추출이 완료되었습니다.${NC}"
echo ""
echo "다른 로컬 PC로 마이그레이션 방법:"
echo "  1. 아래 파일을 USB/클라우드/SCP 등으로 대상 PC에 복사하세요."
echo "     → $OUTPUT_FILE"
echo "  2. 대상 PC에서 프로젝트의 mysql-backup/ 폴더에 넣고 이름을 local_backup.sql 로 맞추세요."
echo "  3. 복원: ./scripts/restore_local_mysql.sh 또는 python scripts/restore_database.py"
echo ""
