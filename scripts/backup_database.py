#!/usr/bin/env python3
"""
로컬 MySQL 데이터베이스 백업(추출) 스크립트
다른 로컬 PC로 마이그레이션할 때 이 스크립트로 덤프 파일을 생성한 뒤,
해당 파일을 복사하여 대상 PC에서 restore 스크립트로 복원합니다.

사용법:
  python scripts/backup_database.py                    # mysql-backup/local_backup.sql 생성
  python scripts/backup_database.py my_export.sql      # mysql-backup/my_export.sql 생성
"""
import os
import sys
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import urlparse, unquote

# 프로젝트 루트로 경로 설정
project_root = Path(__file__).parent.parent
os.chdir(project_root)

# .env 로드 (backend/.env 우선, 프로젝트 루트 .env로 덮어쓰기)
from dotenv import load_dotenv
load_dotenv(project_root / "backend" / ".env")
load_dotenv(project_root / ".env")


def get_db_config():
    """데이터베이스 설정 가져오기 (MYSQL_DATABASE_URL 또는 DB_* 환경 변수)"""
    url = os.environ.get("MYSQL_DATABASE_URL") or os.environ.get("DATABASE_URL", "")
    if url and ("mysql" in url or "pymysql" in url):
        try:
            # mysql+pymysql://user:pass@host:port/dbname
            parsed = urlparse(url)
            if parsed.username and parsed.path:
                return {
                    "type": "mysql",
                    "host": parsed.hostname or "localhost",
                    "port": str(parsed.port or 3306),
                    "user": unquote(parsed.username or ""),
                    "password": unquote(parsed.password or "") if parsed.password else "",
                    "database": (parsed.path.lstrip("/").split("?")[0] or "test_management"),
                }
        except Exception:
            pass
    if os.environ.get("DB_TYPE", "").lower() == "mysql" or (url and "mysql" in url):
        return {
            "type": "mysql",
            "host": os.environ.get("DB_HOST", "localhost"),
            "port": os.environ.get("DB_PORT", "3306"),
            "user": os.environ.get("DB_USER", "root"),
            "password": os.environ.get("DB_PASSWORD", "1q2w%2E%23E%24R"),
            "database": os.environ.get("DB_NAME", "test_management"),
        }
    return {"type": "sqlite"}


def run_backup(config, output_path: Path) -> bool:
    """mysqldump를 사용해 백업 파일 생성"""
    cnf = tempfile.NamedTemporaryFile(mode="w", suffix=".cnf", delete=False)
    try:
        cnf.write("[client]\n")
        cnf.write(f"user={config['user']}\n")
        cnf.write(f"password={config['password']}\n")
        cnf.write(f"host={config['host']}\n")
        cnf.write(f"port={config['port']}\n")
        cnf.close()
        os.chmod(cnf.name, 0o600)

        cmd = [
            "mysqldump",
            f"--defaults-extra-file={cnf.name}",
            "--single-transaction",
            "--routines",
            "--triggers",
            "--events",
            "--set-charset",
            "--default-character-set=utf8mb4",
            config["database"],
        ]
        with open(output_path, "w", encoding="utf-8") as f:
            proc = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
        if proc.returncode != 0:
            print(f"❌ mysqldump 실패: {proc.stderr}")
            return False
        return True
    finally:
        try:
            os.unlink(cnf.name)
        except OSError:
            pass


def main():
    config = get_db_config()
    if config.get("type") != "mysql":
        print("❌ MySQL 설정을 찾을 수 없습니다.")
        print("  backend/.env 또는 프로젝트 루트 .env에 다음 중 하나를 설정하세요:")
        print("  - MYSQL_DATABASE_URL=mysql+pymysql://user:password@host:port/dbname")
        print("  - 또는 DB_TYPE=mysql, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME")
        sys.exit(1)

    output_name = sys.argv[1] if len(sys.argv) > 1 else "local_backup.sql"
    backup_dir = project_root / "mysql-backup"
    backup_dir.mkdir(parents=True, exist_ok=True)
    output_path = backup_dir / output_name

    print("📤 로컬 MySQL 데이터베이스 백업(추출) 시작...")
    print(f"   호스트: {config['host']}:{config['port']}")
    print(f"   데이터베이스: {config['database']}")
    print(f"   출력: {output_path}")
    print("")

    # 연결 테스트 (선택)
    try:
        import pymysql
        conn = pymysql.connect(
            host=config["host"],
            port=int(config["port"]),
            user=config["user"],
            password=config["password"],
            database=config["database"],
            charset="utf8mb4",
        )
        conn.close()
    except Exception as e:
        print(f"❌ MySQL 연결 실패: {e}")
        if "1045" in str(e) or "Access denied" in str(e):
            print("   → 비밀번호 불일치일 수 있습니다. backend/.env 의 MYSQL_DATABASE_URL 또는 DB_PASSWORD를 로컬 MySQL root 비밀번호에 맞게 수정하세요.")
        sys.exit(1)

    if not run_backup(config, output_path):
        sys.exit(1)

    size_kb = output_path.stat().st_size / 1024
    print(f"✅ 백업 완료: {output_path}")
    print(f"   파일 크기: {size_kb:.1f} KB")
    print("")
    print("다른 로컬 PC로 마이그레이션:")
    print("  1. 위 파일을 대상 PC에 복사한 뒤 mysql-backup/ 에 두고 이름을 local_backup.sql 로 맞추세요.")
    print("  2. 복원: ./scripts/restore_local_mysql.sh 또는 python scripts/restore_database.py")


if __name__ == "__main__":
    main()
