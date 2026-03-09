# S3 데이터베이스 백업 가이드

## 📋 현재 백업 파일 위치

### 로컬 백업 파일
- **위치**: `mysql-backup/local_backup.sql`
- **설명**: 로컬에서 생성된 MySQL 덤프 파일

## 🔍 S3 백업 파일 찾기

### 방법 1: AWS CLI 사용

```bash
# AWS CLI 설치 확인
aws --version

# S3 버킷 목록 확인
aws s3 ls

# 특정 버킷의 백업 파일 확인
aws s3 ls s3://test-platform-backups/database/ --recursive

# 백업 파일 다운로드
aws s3 cp s3://test-platform-backups/database/backup_20250101.sql ./mysql-backup/
```

### 방법 2: Python 스크립트 사용

1. **환경 변수 설정** (`.env` 파일):
```env
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=ap-northeast-2
S3_BACKUP_BUCKET=test-platform-backups
S3_BACKUP_PREFIX=database/
```

2. **스크립트 실행**:
```bash
# 백업 파일 목록 조회
python scripts/download_s3_backup.py list

# 최신 백업 파일 다운로드
python scripts/download_s3_backup.py download-latest

# 특정 파일 다운로드
python scripts/download_s3_backup.py download database/backup_20250101.sql
```

### 방법 3: AWS 콘솔 사용

1. AWS 콘솔에 로그인
2. S3 서비스로 이동
3. 버킷 목록에서 백업 버킷 찾기 (예: `test-platform-backups`)
4. `database/` 폴더 확인
5. 백업 파일 다운로드

## 📥 백업 파일 복원

### MySQL에 복원

```bash
# MySQL에 데이터베이스 생성 (없는 경우)
mysql -u root -p -e "CREATE DATABASE test_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 백업 파일 복원
mysql -u root -p test_management < mysql-backup/local_backup.sql
```

### Docker MySQL에 복원

```bash
# Docker 컨테이너에 복원
docker exec -i test_management mysql -u root -p1q2w#E$R test_management < mysql-backup/local_backup.sql
```

## 🔄 자동 백업 설정

### S3에 백업 업로드 스크립트

```bash
#!/bin/bash
# scripts/upload_backup_to_s3.sh

BACKUP_FILE="mysql-backup/backup_$(date +%Y%m%d_%H%M%S).sql"
S3_BUCKET="test-platform-backups"
S3_PATH="database/backup_$(date +%Y%m%d_%H%M%S).sql"

# MySQL 덤프 생성 (비밀번호를 명령줄에 넣지 않으면 경고가 나오지 않음)
# 방법 1: 임시 설정 파일 사용
MYSQL_CNF=$(mktemp) && chmod 600 "$MYSQL_CNF" && printf '[client]\nuser=root\npassword=1q2w#E$R\n' > "$MYSQL_CNF"
mysqldump --defaults-extra-file="$MYSQL_CNF" test_management > $BACKUP_FILE
rm -f "$MYSQL_CNF"
# 방법 2 (경고 발생): mysqldump -u root -p1q2w#E$R test_management > $BACKUP_FILE

# S3에 업로드
aws s3 cp $BACKUP_FILE s3://$S3_BUCKET/$S3_PATH

echo "✅ 백업 완료: s3://$S3_BUCKET/$S3_PATH"
```

## 📝 일반적인 S3 버킷 이름

프로젝트에서 사용할 수 있는 S3 버킷 이름들:
- `test-platform-backups` - 데이터베이스 백업용
- `test-platform-scripts` - 테스트 스크립트용 (기존)
- `test-platform-data` - 일반 데이터용

## 🆘 문제 해결

### AWS 자격 증명 오류
```bash
# AWS 자격 증명 확인
aws configure list

# 자격 증명 설정
aws configure
```

### 버킷 접근 권한 오류
- IAM 정책에서 S3 버킷 접근 권한 확인
- 버킷 정책 확인

### 파일을 찾을 수 없음
- 버킷 이름 확인
- 파일 경로(prefix) 확인
- AWS 리전 확인

## 📚 관련 문서

- [S3 설정 가이드](./docs/S3_SETUP_GUIDE.md)
- [로컬 DB 설정 가이드](./LOCAL_DB_SETUP.md)
- [MySQL 백업 및 복원](./LOCAL_DATABASE_SETUP.md)

