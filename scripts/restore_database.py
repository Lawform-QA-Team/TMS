#!/usr/bin/env python3
"""
데이터베이스 복구 스크립트 (Python 버전)
local_backup.sql 파일을 사용하여 데이터베이스를 복구합니다.
"""
import os
import sys
import subprocess
import tempfile
from pathlib import Path
from dotenv import load_dotenv

# 프로젝트 루트로 경로 설정
project_root = Path(__file__).parent.parent
os.chdir(project_root)

# .env 파일 로드
load_dotenv()

def get_db_config():
    """데이터베이스 설정 가져오기"""
    db_type = os.environ.get('DB_TYPE', 'sqlite').lower()
    
    if db_type == 'mysql' or os.environ.get('DATABASE_URL', '').startswith('mysql'):
        return {
            'type': 'mysql',
            'host': os.environ.get('DB_HOST', 'localhost'),
            'port': os.environ.get('DB_PORT', '3306'),
            'user': os.environ.get('DB_USER', 'root'),
            'password': os.environ.get('DB_PASSWORD', '1q2w#E$R'),
            'database': os.environ.get('DB_NAME', 'test_management')
        }
    else:
        return {'type': 'sqlite'}

def test_mysql_connection(config):
    """MySQL 연결 테스트"""
    try:
        import pymysql
        connection = pymysql.connect(
            host=config['host'],
            port=int(config['port']),
            user=config['user'],
            password=config['password'],
            charset='utf8mb4'
        )
        connection.close()
        return True
    except Exception as e:
        print(f"❌ MySQL 연결 실패: {e}")
        return False

def restore_mysql(config, backup_file):
    """MySQL 데이터베이스 복구"""
    import pymysql
    
    print(f"🔄 MySQL 데이터베이스 복구 시작...")
    print(f"   호스트: {config['host']}:{config['port']}")
    print(f"   데이터베이스: {config['database']}")
    
    # 연결 테스트
    if not test_mysql_connection(config):
        print("\n다음 사항을 확인하세요:")
        print("  1. MySQL 서비스가 실행 중인지 확인")
        print("  2. Docker Compose로 MySQL 실행: docker-compose up -d mysql")
        print("  3. 연결 정보가 올바른지 확인 (.env 파일)")
        return False
    
    try:
        # 데이터베이스 연결
        connection = pymysql.connect(
            host=config['host'],
            port=int(config['port']),
            user=config['user'],
            password=config['password'],
            charset='utf8mb4'
        )
        
        cursor = connection.cursor()
        
        # 데이터베이스 존재 여부 확인
        cursor.execute(f"SHOW DATABASES LIKE '{config['database']}'")
        db_exists = cursor.fetchone() is not None
        
        if db_exists:
            print(f"\n⚠️  데이터베이스 '{config['database']}'가 이미 존재합니다.")
            response = input("기존 데이터베이스를 삭제하고 복구하시겠습니까? (y/N): ")
            if response.lower() != 'y':
                print("복구를 취소했습니다.")
                cursor.close()
                connection.close()
                return False
            
            print("🗑️  기존 데이터베이스 삭제 중...")
            cursor.execute(f"DROP DATABASE IF EXISTS `{config['database']}`")
        
        # 데이터베이스 생성
        print("📦 데이터베이스 생성 중...")
        cursor.execute(f"CREATE DATABASE `{config['database']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        cursor.close()
        connection.close()
        
        # 백업 파일 복구 (mysqldump 형식이므로 mysql 명령어 사용)
        # 비밀번호를 명령줄에 넘기지 않기 위해 임시 설정 파일 사용 (경고 제거 + 보안)
        print("📥 백업 파일 복구 중...")
        print("   이 작업은 몇 분이 걸릴 수 있습니다...")
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.cnf', delete=False) as cnf:
            cnf.write("[client]\n")
            cnf.write(f"user={config['user']}\n")
            cnf.write(f"password={config['password']}\n")
            cnf.write(f"host={config['host']}\n")
            cnf.write(f"port={config['port']}\n")
            cnf_path = cnf.name
        try:
            os.chmod(cnf_path, 0o600)
            mysql_cmd = [
                'mysql',
                f'--defaults-extra-file={cnf_path}',
                config['database']
            ]
            with open(backup_file, 'r', encoding='utf-8') as f:
                process = subprocess.Popen(
                    mysql_cmd,
                    stdin=f,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                stdout, stderr = process.communicate()
        finally:
            try:
                os.unlink(cnf_path)
            except OSError:
                pass
        
        if process.returncode != 0:
            print(f"❌ 데이터베이스 복구 실패: {stderr}")
            return False
        
        # 복구 확인
        print("\n🔍 복구 확인 중...")
        connection = pymysql.connect(
            host=config['host'],
            port=int(config['port']),
            user=config['user'],
            password=config['password'],
            database=config['database'],
            charset='utf8mb4'
        )
        cursor = connection.cursor()
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        table_count = len(tables)
        
        if table_count > 0:
            print(f"✅ 복구 확인 완료")
            print(f"   복구된 테이블 수: {table_count}")
            print("\n📋 테이블 목록:")
            for table in tables:
                print(f"   - {table[0]}")
        else:
            print("⚠️  테이블이 복구되지 않았습니다.")
        
        cursor.close()
        connection.close()
        
        print("\n🎉 데이터베이스 복구 프로세스 완료!")
        print("\n다음 단계:")
        print("  1. 백엔드 애플리케이션 재시작")
        print("  2. http://localhost:8000/health 에서 데이터베이스 연결 확인")
        print("  3. http://localhost:8000/init-db 로 기본 사용자 생성 (필요시)")
        
        return True
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    backup_file = project_root / "mysql-backup" / "local_backup.sql"
    
    if not backup_file.exists():
        print(f"❌ 백업 파일을 찾을 수 없습니다: {backup_file}")
        sys.exit(1)
    
    print(f"✅ 백업 파일 확인: {backup_file}")
    print(f"   파일 크기: {backup_file.stat().st_size / 1024:.1f} KB")
    
    config = get_db_config()
    
    if config['type'] == 'sqlite':
        print("\n❌ SQLite는 MySQL 덤프 파일을 직접 복구할 수 없습니다.")
        print("MySQL을 사용하도록 설정하세요:")
        print("  .env 파일에 다음 추가:")
        print("  DB_TYPE=mysql")
        print("  DB_HOST=localhost")
        print("  DB_PORT=3306")
        print("  DB_USER=root")
        print("  DB_PASSWORD=1q2w#E$R")
        print("  DB_NAME=test_management")
        sys.exit(1)
    
    success = restore_mysql(config, backup_file)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()

