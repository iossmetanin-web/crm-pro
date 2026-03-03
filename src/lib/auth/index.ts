import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import { UserRole } from "@prisma/client";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireAuth();
  if (user.role !== role && user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

export async function isManager() {
  const user = await getCurrentUser();
  return user?.role === "MANAGER" || user?.role === "ADMIN";
}
