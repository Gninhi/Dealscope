import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from './db';
import { verifyPassword } from './password';
import { isRateLimited } from './security';

// Track failed login attempts per email for account lockout
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Lazy cleanup — only starts when first authorize() is called
let cleanupStarted = false;
function scheduleLockoutCleanup() {
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        scheduleLockoutCleanup();

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();

        // Check if account is locked
        const attempts = failedAttempts.get(email);
        if (attempts && attempts.lockedUntil > Date.now()) {
          return null;
        }

        // Brute-force protection
        const clientIp = 'credential:' + email;
        if (isRateLimited(clientIp, 10, 5 * 60 * 1000)) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email },
          include: { workspace: true },
        });

        if (!user || !user.password) {
          recordFailedAttempt(email);
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password,
        );

        if (!isValid) {
          recordFailedAttempt(email);
          return null;
        }

        // Successful login — clear failed attempts
        failedAttempts.delete(email);

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
        token.role = (user as Record<string, unknown>).role as string;
        token.workspaceId = (user as Record<string, unknown>).workspaceId as string;
        token.workspaceSlug = (user as Record<string, unknown>).workspaceSlug as string;
        token.iat = Math.floor(Date.now() / 1000);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // NextAuth User type doesn't include our custom fields — use cast
        (session.user as unknown as Record<string, unknown>).role = token.role;
        (session.user as unknown as Record<string, unknown>).workspaceId = token.workspaceId;
        (session.user as unknown as Record<string, unknown>).workspaceSlug = token.workspaceSlug;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

/**
 * Record a failed login attempt and potentially lock the account.
 */
function recordFailedAttempt(email: string): void {
  const now = Date.now();
  const existing = failedAttempts.get(email);

  if (!existing) {
    failedAttempts.set(email, { count: 1, lockedUntil: 0 });
  } else {
    existing.count++;
    if (existing.count >= MAX_FAILED_ATTEMPTS) {
      const backoffMinutes = Math.min(
        15 * Math.pow(2, Math.min(existing.count - MAX_FAILED_ATTEMPTS, 4)),
        240,
      );
      existing.lockedUntil = now + backoffMinutes * 60 * 1000;
    }
  }
}
