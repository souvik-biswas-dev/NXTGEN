import bcrypt from 'bcryptjs';

const ROUNDS = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/** Hash short tokens / OTP codes for at-rest storage (sha-via-bcrypt is fine here). */
export const hashSecret = (s: string) => bcrypt.hash(s, 10);
export const verifySecret = (s: string, hash: string) => bcrypt.compare(s, hash);
