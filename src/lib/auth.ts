import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from './db';
import { verifyPassword } from './password';
import { isRateLimited } from './security/core/rate-limiter';
import { logAuthSuccess, logAuthFailure, logAuthLocked } from './security/core/audit-logger';
import { SECURITY_CONSTANTS } from './security/core/constants';

interface FailedAttempt {
  count: number;
  lockedUntil: number;
}

const failedAttempts = new Map<string, FailedAttempt>();
let cleanupStarted = false;

function scheduleLockoutCleanup(): void {
  if (cleanupStarted) return;
  cleanupStarted = true;

  if (typeof setInterval === 'function') {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of failedAttempts.entries()) {
        if (now > entry.lockedUntil) {
          failedAttempts.delete(key);
        }
      }
    }, 10 * 60 * 1000);
  }
}

function recordFailedAttempt(email: string): void {
  scheduleLockoutCleanup();

  const now = Date.now();
  const existing = failedAttempts.get(email);

  if (!existing) {
    failedAttempts.set(email, { count: 1, lockedUntil: 0 });
    return;
  }

  existing.count++;

  if (existing.count >= SECURITY_CONSTANTS.PASSWORD.MAX_FAILED_ATTEMPTS) {
    const backoffMinutes = Math.min(
      15 * Math.pow(2, Math.min(existing.count - SECURITY_CONSTANTS.PASSWORD.MAX_FAILED_ATTEMPTS, 4)),
      SECURITY_CONSTANTS.PASSWORD.MAX_LOCKOUT_MINUTES
    );
    existing.lockedUntil = now + backoffMinutes * 60 * 1000;
  }
}

function clearFailedAttempts(email: string): void {
  failedAttempts.delete(email);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials, request) {
        scheduleLockoutCleanup();

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const ip = request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

        const attempts = failedAttempts.get(email);
        if (attempts && attempts.lockedUntil > Date.now()) {
          logAuthLocked(email, ip, 'login');
          return null;
        }

        const rateLimitKey = `auth:${email}`;
        if (isRateLimited(rateLimitKey, 10, 5 * 60 * 1000)) {
          logAuthFailure(ip, 'login', 'Rate limited');
          return null;
        }

        const user = await db.user.findUnique({
          where: { email },
          include: { workspace: true },
        });

        if (!user || !user.password) {
          recordFailedAttempt(email);
          logAuthFailure(ip, 'login', 'User not found');
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          recordFailedAttempt(email);
          logAuthFailure(ip, 'login', 'Invalid password', { userId: user.id });
          return null;
        }

        clearFailedAttempts(email);
        logAuthSuccess(user.id, ip, 'login');

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim() || user.email,
          role: user.role,
          workspaceId: user.workspaceId,
          workspaceSlug: user.workspace.slug,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as unknown as Record<string, unknown>).role as string;
        token.workspaceId = (user as unknown as Record<string, unknown>).workspaceId as string;
        token.workspaceSlug = (user as unknown as Record<string, unknown>).workspaceSlug as string;
        token.iat = Math.floor(Date.now() / 1000);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as Record<string, unknown>).role = token.role;
        (session.user as unknown as Record<string, unknown>).workspaceId = token.workspaceId;
        (session.user as unknown as Record<string, unknown>).workspaceSlug = token.workspaceSlug;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
