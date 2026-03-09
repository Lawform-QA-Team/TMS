# Ubuntu MySQL 서버 Docker 설정 가이드

## 개요
Vercel 배포 시 MySQL 연결 문제를 해결하기 위해 Docker로 Ubuntu 서버를 구성하고 MySQL을 설치하는 방법입니다.

## 아키텍처
```
로컬 개발 환경 → Docker Ubuntu 서버 → Vercel 배포
     ↓              ↓           ↓
  MySQL 3307    MySQL 3306   환경변수로 연결
```

## 파일 구조
```
├── docker-compose.ubuntu.yml    # Ubuntu MySQL 서버 Docker 설정
├── start-ubuntu-mysql.sh        # 메인 시작 스크립트
├── ubuntu-setup/                # Ubuntu 서버 설정 스크립트
│   ├── setup-mysql.sh          # MySQL 설치 및 설정
│   ├── migrate-data.sh         # 데이터 마이그레이션
│   └── health-check.sh         # 서버 상태 확인
└── mysql-backup/                # 데이터 백업 디렉토리
```

## 시작 방법

### 1. Ubuntu MySQL 서버 시작
```bash
chmod +x start-ubuntu-mysql.sh
./start-ubuntu-mysql.sh
```

### 2. 데이터 마이그레이션
```bash
docker exec ubuntu-mysql-server bash /setup/migrate-data.sh
```

### 3. 서버 상태 확인
```bash
docker exec ubuntu-mysql-server bash /setup/health-check.sh
```

## 연결 정보

### Ubuntu MySQL 서버
- **호스트**: localhost (또는 Docker IP)
- **포트**: 3306
- **데이터베이스**: test_management
- **사용자**: vercel_user
- **비밀번호**: vercel_secure_pass_2025

### 로컬 MySQL (백업용)
- **호스트**: localhost
- **포트**: 3307
- **데이터베이스**: test_management
- **사용자**: root
- **비밀번호**: 1q2w#E$R

## Vercel 환경변수 설정

Vercel 대시보드에서 다음 환경변수를 설정하세요:

```env
DATABASE_URL=mysql+pymysql://vercel_user:vercel_secure_pass_2025@localhost:3306/test_management
```

## 문제 해결

### MySQL 연결 실패
```bash
# 컨테이너 상태 확인
docker ps

# 로그 확인
docker logs ubuntu-mysql-server

# MySQL 서비스 재시작
docker exec ubuntu-mysql-server service mysql restart
```

### 포트 충돌
```bash
# 포트 사용 확인
lsof -i :3306

# 기존 컨테이너 정리
docker-compose -f docker-compose.ubuntu.yml down -v
```

## 백업 및 복원

### 데이터 백업
```bash
# 비밀번호를 명령줄에 넣으면 "Using a password on the command line..." 경고가 나올 수 있음.
# 로컬 스크립트(scripts/restore_local_mysql.sh 등)는 임시 설정 파일을 사용해 경고를 피함.
docker exec ubuntu-mysql-server mysqldump -u root -p1q2w#E$R test_management > backup.sql
```

### 데이터 복원
```bash
docker exec -i ubuntu-mysql-server mysql -u root -p1q2w#E$R test_management < backup.sql
```

## 보안 고려사항

1. **강력한 비밀번호 사용**: 프로덕션에서는 더 강력한 비밀번호 사용
2. **방화벽 설정**: 필요한 포트만 열기
3. **SSL 연결**: 프로덕션에서는 SSL 연결 권장
4. **정기 백업**: 데이터 손실 방지를 위한 정기 백업

## 다음 단계

1. ✅ Ubuntu MySQL 서버 구성
2. 🔄 데이터 마이그레이션
3. 🔗 Vercel 연결 테스트
4. 🚀 프로덕션 배포
5. 📊 모니터링 및 유지보수
