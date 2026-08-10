/**
 * 로컬 MySQL Users → RDS PostgreSQL Users 마이그레이션 스크립트
 * 실행: PROD_DATABASE_URL="postgresql://..." npx tsx scripts/migrate-users.ts
 */

import mysql from 'mysql2/promise'
import pg from 'pg'

const MYSQL_CONFIG = {
  host: '127.0.0.1',
  user: 'root',
  password: '1q2w#E$R',
  database: 'test_management',
}

interface MySQLUser {
  id: number
  username: string
  email: string
  password_hash: string
  first_name: string | null
  last_name: string | null
  role: string
  is_active: number
  last_login: Date | null
  created_at: Date
  updated_at: Date
}

async function main() {
  const prodUrl = process.env.PROD_DATABASE_URL
  if (!prodUrl) {
    console.error('PROD_DATABASE_URL 환경변수가 필요합니다.')
    process.exit(1)
  }

  const conn = await mysql.createConnection(MYSQL_CONFIG)
  console.log('MySQL 연결 성공')

  const pgClient = new pg.Client({ connectionString: prodUrl })
  await pgClient.connect()
  console.log('PostgreSQL 연결 성공')

  try {
    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
      'SELECT id, username, email, password_hash, first_name, last_name, role, is_active, last_login, created_at, updated_at FROM Users'
    )
    const users = rows as MySQLUser[]
    console.log(`MySQL Users 수: ${users.length}`)

    let success = 0
    let skipped = 0

    for (const u of users) {
      try {
        const role = u.role === 'viewer' ? 'user' : u.role
        await pgClient.query(
          `INSERT INTO "Users" (username, email, password_hash, first_name, last_name, role, is_active, last_login, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (username) DO NOTHING`,
          [
            u.username,
            u.email,
            u.password_hash,
            u.first_name,
            u.last_name,
            role,
            Boolean(u.is_active),
            u.last_login,
            u.created_at,
            u.updated_at,
          ]
        )
        console.log(`  [OK] ${u.username} (${role})`)
        success++
      } catch (e) {
        console.log(`  [SKIP] ${u.username}: ${(e as Error).message}`)
        skipped++
      }
    }

    console.log(`\n완료: 성공 ${success}명, 스킵 ${skipped}명`)
  } finally {
    await conn.end()
    await pgClient.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
