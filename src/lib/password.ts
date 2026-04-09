import bcrypt from 'bcryptjs';
import { SECURITY_CONSTANTS } from './security/core/constants';

const SALT_ROUNDS = SECURITY_CONSTANTS.PASSWORD.SALT_ROUNDS;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
