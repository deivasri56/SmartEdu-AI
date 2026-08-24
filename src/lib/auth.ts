// src/lib/auth.ts
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// ------------------- Password utilities -------------------
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ------------------- JWT utilities -------------------
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'default_secret');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // default 7 days

export async function signToken(payload: JWTPayload): Promise<string> {
  const expiresInSeconds = (() => {
    const match = JWT_EXPIRES_IN.match(/(\d+)([smhd])/);
    if (!match) return 7 * 24 * 60 * 60;
    const [, amount, unit] = match;
    const num = parseInt(amount, 10);
    switch (unit) {
      case 's': return num;
      case 'm': return num * 60;
      case 'h': return num * 60 * 60;
      case 'd': return num * 24 * 60 * 60;
      default: return 7 * 24 * 60 * 60;
    }
  })();

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (err) {
    console.warn('Invalid JWT', err);
    return null;
  }
}

// Compatibility aliases used by existing route code
export const signJWT = signToken;
export async function getSession(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get('auth')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Helper to set HTTP‑only cookie with the JWT
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set('auth', '', { path: '/', maxAge: 0 });
}
