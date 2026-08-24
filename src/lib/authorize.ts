// src/lib/authorize.ts
import { NextResponse } from 'next/server';
import type { JWTPayload } from 'jose';

/** Extract user info from request headers set by middleware */
export function getUserFromHeaders(req: Request): JWTPayload | null {
  const headers = new Headers(req.headers);
  const role = headers.get('x-user-role');
  const userId = headers.get('x-user-id');
  const email = headers.get('x-user-email');
  const name = headers.get('x-user-name');
  if (role && userId && email && name) {
    return {
      role: role as string,
      userId: userId as string,
      email: email as string,
      name: name as string,
    } as JWTPayload;
  }
  return null;
}

/** Require a specific role, otherwise throw 403 */
export function requireRole(req: Request, allowedRoles: string[]): JWTPayload {
  const user = getUserFromHeaders(req);
  if (!user) {
    throw new Error('Unauthenticated');
  }
  if (!allowedRoles.includes(user.role as string)) {
    throw new Error('Forbidden');
  }
  return user;
}
