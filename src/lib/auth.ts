import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { users } from "@/lib/data/mock-data";
import { isDatabaseConfigured, getPrismaClient } from "@/lib/prisma";
import { isServerDeactivated } from "@/lib/server-auth-state";

/**
 * Dual-mode credential check:
 *  - If DATABASE_URL is set (a real MySQL database is connected), look the
 *    user up via Prisma and compare against a bcrypt hash — this is the
 *    production path, and it's how users created through Masters → Users
 *    actually become able to log in.
 *  - Otherwise, fall back to the bundled mock-data list with a direct
 *    string comparison (the demo accounts ship with plaintext passwords in
 *    mock-data.ts specifically so this path works out of the box with zero
 *    setup). This is what runs in this current build/zip.
 *
 * The Prisma path is wrapped in try/catch: if DATABASE_URL is set but
 * unreachable (wrong credentials, DB not running yet, migrations not run),
 * we fail the login attempt rather than silently falling back to mock data
 * — mixing the two would be confusing and is not how a real deployment
 * should behave.
 */
async function verifyCredentials(email: string, password: string) {
  if (isDatabaseConfigured) {
    try {
      const prisma = getPrismaClient();
      const dbUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!dbUser || !dbUser.isActive) return null;
      const valid = await bcrypt.compare(password, dbUser.passwordHash);
      if (!valid) return null;
      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role as string,
        departmentId: dbUser.departmentId,
        departmentName: "", // resolved below via department relation if needed
      };
    } catch (err) {
      console.error("[auth] Prisma lookup failed — is DATABASE_URL reachable and migrated?", err);
      return null;
    }
  }

  // ── Mock-data fallback (current sandbox / zero-setup demo mode) ──
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !user.isActive) return null;
  // Also check the runtime deactivation registry — covers users deactivated
  // via Masters → Users during the current server session (these mutations
  // only reach the static import via the server-side registry; see
  // src/lib/server-auth-state.ts and src/app/api/users/[id]/route.ts)
  if (isServerDeactivated(user.id)) return null;
  if (user.passwordHash !== password) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    departmentName: user.departmentName,
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        return verifyCredentials(credentials.email, credentials.password);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.departmentId = (user as { departmentId: string }).departmentId;
        token.departmentName = (user as { departmentName: string }).departmentName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.departmentId = token.departmentId as string;
        session.user.departmentName = token.departmentName as string;
      }
      return session;
    },
  },
};
