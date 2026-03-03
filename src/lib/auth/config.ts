import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db, isDemo } from "@/lib/db";
import { UserRole } from "@prisma/client";

// Note: PrismaAdapter is not used because we use JWT strategy

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      avatar?: string | null;
    };
  }
  
  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string | null;
  }
}

// Demo users for Vercel deployment without database
const demoUsers: Record<string, { id: string; email: string; name: string; role: UserRole; password: string }> = {
  "admin@crm.com": {
    id: "user-admin",
    email: "admin@crm.com",
    name: "Admin User",
    role: "ADMIN" as UserRole,
    password: "admin123",
  },
  "manager@crm.com": {
    id: "user-manager-1",
    email: "manager@crm.com",
    name: "Sarah Johnson",
    role: "MANAGER" as UserRole,
    password: "manager123",
  },
  "manager1@crm.com": {
    id: "user-manager-1",
    email: "manager1@crm.com",
    name: "Sarah Johnson",
    role: "MANAGER" as UserRole,
    password: "manager123",
  },
  "manager2@crm.com": {
    id: "user-manager-2",
    email: "manager2@crm.com",
    name: "Mike Wilson",
    role: "MANAGER" as UserRole,
    password: "manager123",
  },
  "manager3@crm.com": {
    id: "user-manager-3",
    email: "manager3@crm.com",
    name: "Emily Davis",
    role: "MANAGER" as UserRole,
    password: "manager123",
  },
  "manager4@crm.com": {
    id: "user-manager-4",
    email: "manager4@crm.com",
    name: "James Brown",
    role: "MANAGER" as UserRole,
    password: "manager123",
  },
  "manager5@crm.com": {
    id: "user-manager-5",
    email: "manager5@crm.com",
    name: "Lisa Anderson",
    role: "MANAGER" as UserRole,
    password: "manager123",
  },
};

// Simple hash function for demo (use bcrypt in production)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'crm_salt_secret');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
}

export const authOptions: NextAuthOptions = {
  adapter: isDemo ? undefined : (db ? PrismaAdapter(db) : undefined),
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Demo mode - use demo users
        if (isDemo) {
          const demoUser = demoUsers[credentials.email.toLowerCase()];
          if (demoUser && demoUser.password === credentials.password) {
            return {
              id: demoUser.id,
              email: demoUser.email,
              name: demoUser.name,
              role: demoUser.role,
              avatar: null,
            };
          }
          return null;
        }

        // Production mode - use database
        if (!db) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValid = await verifyPassword(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.avatar = token.avatar;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
  },
};

export { hashPassword };
