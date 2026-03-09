# 로컬 DB → 다른 로컬 PC 마이그레이션 가이드

한 로컬 PC의 MySQL 데이터베이스를 다른 로컬 PC로 옮기기 위한 **백업 추출**과 **복원(마이그레이션)** 절차입니다.

---

## 1. 요약

| 단계 | 위치 | 작업 |
|------|------|------|
| 1. 백업 추출 | **원본 PC (DB 있는 PC)** | 백업 스크립트 실행 → SQL 덤프 파일 생성 |
| 2. 파일 전달 | - | 생성된 파일을 대상 PC로 복사 (USB, 클라우드, SCP 등) |
| 3. 복원 | **대상 PC (마이그레이션할 PC)** | 복원 스크립트 실행 → DB 생성 및 데이터 적재 |

---

## 2. 원본 PC에서 백업(데이터 추출)

원본 PC에서 프로젝트 루트(`TMS/`)로 이동한 뒤 아래 중 하나를 실행합니다.

### 방법 A: Shell 스크립트 (권장)

```bash
chmod +x scripts/backup_database.sh
./scripts/backup_database.sh
```

- 기본 출력: `mysql-backup/local_backup.sql`
- 타임스탬프 백업도 함께 생성: `mysql-backup/backup_YYYYMMDD_HHMMSS.sql`
- 다른 파일명으로 저장: `./scripts/backup_database.sh my_export.sql` → `mysql-backup/my_export.sql`

연결 정보는 환경 변수로 덮어쓸 수 있습니다.

```bash
export DB_HOST=localhost DB_PORT=3306 DB_USER=root DB_NAME=test_management
export DB_PASSWORD='1q2w#E$R'
./scripts/backup_database.sh
```

### 방법 B: Python 스크립트

```bash
python scripts/backup_database.py
```

- 기본 출력: `mysql-backup/local_backup.sql`
- 설정: `backend/.env` 또는 프로젝트 루트 `.env`의 `MYSQL_DATABASE_URL` 또는 `DB_*` 사용

다른 파일명으로 저장:

```bash
python scripts/backup_database.py my_export.sql
```

### 백업 후 확인

```bash
ls -lh mysql-backup/
# local_backup.sql (및 필요 시 backup_*.sql) 크기 확인
```

---

## 3. 백업 파일을 대상 PC로 전달

다음 중 편한 방법으로 **대상 PC의 프로젝트**로 파일을 옮깁니다.

- USB/외장 디스크에 `mysql-backup/` 폴더 통째로 또는 `local_backup.sql`만 복사
- 클라우드(Google Drive, Dropbox 등) 업로드 후 대상 PC에서 다운로드
- SCP: `scp mysql-backup/local_backup.sql user@대상PC:/path/to/TMS/mysql-backup/`
- Git: 대용량이면 LFS 사용 또는 `mysql-backup/`은 `.gitignore`에 두고 위 방법 사용 권장

대상 PC에서는 **반드시** 프로젝트 내 `mysql-backup/local_backup.sql` 경로에 두면 복원 스크립트가 그대로 사용할 수 있습니다.  
다른 이름으로 둔 경우 복원 전에 `local_backup.sql`로 이름을 맞추거나, 아래 복원 명령에서 해당 파일을 사용하도록 하세요.

---

## 4. 대상 PC에서 복원(마이그레이션)

대상 PC에서 MySQL이 설치·실행 중이어야 합니다.  
설정은 [로컬 MySQL 복구 가이드](./LOCAL_MYSQL_RESTORE.md)를 참고합니다.

### 전제 조건

- MySQL 서비스 실행 (예: `brew services start mysql`)
- 프로젝트 클론 또는 복사 완료
- 백업 파일 위치: `TMS/mysql-backup/local_backup.sql` (또는 복원 스크립트가 찾는 경로)

### 방법 1: Shell 스크립트 (권장)

```bash
chmod +x scripts/restore_local_mysql.sh
./scripts/restore_local_mysql.sh
```

- 기존 `test_management` DB가 있으면 덮어쓸지 묻습니다.
- 복원 후 테이블 목록으로 검증합니다.

### 방법 2: Python 스크립트

```bash
python scripts/restore_database.py
```

- `mysql-backup/local_backup.sql`을 사용합니다.
- `.env`에서 MySQL 설정을 읽습니다.

### 방법 3: 수동 복원

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS test_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p test_management < mysql-backup/local_backup.sql
```

---

## 5. 복원 후 확인

- 테이블 확인: `mysql -u root -p test_management -e "SHOW TABLES;"`
- 백엔드 실행 후: `curl http://localhost:8000/health`
- 필요 시: `http://localhost:8000/init-db` 로 기본 사용자 생성

---

## 6. 환경 변수 정리

복원 시 대상 PC의 DB 연결 정보는 **대상 PC의 .env**를 사용합니다.  
원본 PC와 사용자/비밀번호/포트가 다르면 대상 PC의 `backend/.env`(또는 프로젝트 루트 `.env`)에 맞게 설정합니다.

```env
# 예시 (대상 PC 기준)
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=대상PC의_비밀번호
DB_NAME=test_management
```

또는:

```env
MYSQL_DATABASE_URL=mysql+pymysql://root:비밀번호@127.0.0.1:3306/test_management
```

---

## 7. 관련 스크립트·문서

| 구분 | 경로 |
|------|------|
| 백업(추출) | `scripts/backup_database.sh`, `scripts/backup_database.py` |
| 복원 | `scripts/restore_local_mysql.sh`, `scripts/restore_database.py` |
| 로컬 MySQL 복구 상세 | [LOCAL_MYSQL_RESTORE.md](./LOCAL_MYSQL_RESTORE.md) |
| 로컬 DB 설정 | [LOCAL_DATABASE_SETUP.md](./LOCAL_DATABASE_SETUP.md) |
