import bcrypt from 'bcryptjs'
import { scrypt } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)
const SALT_ROUNDS = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

// Python werkzeug scrypt 형식: scrypt:N:r:p$salt$hash
async function verifyWerkzeugScrypt(plain: string, storedHash: string): Promise<boolean> {
  try {
    const dollarParts = storedHash.split('$')
    if (dollarParts.length !== 3) return false
    const methodPart = dollarParts[0]!
    const salt = dollarParts[1]!
    const expectedHex = dollarParts[2]!
    const colonParts = methodPart.split(':')
    const N = parseInt(colonParts[1] ?? '32768')
    const r = parseInt(colonParts[2] ?? '8')
    const p = parseInt(colonParts[3] ?? '1')
    const keylen = Math.floor(expectedHex.length / 2)
    const derived = await scryptAsync(plain, salt, keylen) as Buffer
    return derived.toString('hex') === expectedHex
  } catch {
    return false
  }
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (hash.startsWith('scrypt:')) {
    return verifyWerkzeugScrypt(plain, hash)
  }
  return bcrypt.compare(plain, hash)
}
