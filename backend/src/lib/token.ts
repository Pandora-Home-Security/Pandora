/*
 * Minimalna HS256 JWT implementacija bez vanjske biblioteke.
 * Izdvojeno iz index.ts radi jediničnog testiranja (vidi token.test.ts).
 */
import crypto from 'crypto';

export type UserRole = 'admin' | 'korisnik';

export type AuthTokenPayload = {
  sub: string;
  email: string;
  ime: string;
  role: UserRole;
  exp: number;
};

const JWT_SECRET = process.env.JWT_SECRET ?? 'pandora-dev-secret';

const base64UrlEncode = (value: string) => Buffer.from(value).toString('base64url');

const createSignature = (value: string) =>
  crypto.createHmac('sha256', JWT_SECRET).update(value).digest('base64url');

export const signToken = (payload: AuthTokenPayload) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createSignature(`${encodedHeader}.${encodedPayload}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifyToken = (token: string): AuthTokenPayload | null => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, receivedSignature] = parts;
  const expectedSignature = createSignature(`${encodedHeader}.${encodedPayload}`);
  if (receivedSignature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf-8'),
    ) as AuthTokenPayload;

    if (!payload.sub || !payload.email || !payload.ime || !payload.exp) {
      return null;
    }
    if (!payload.role) {
      payload.role = 'korisnik';
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};
