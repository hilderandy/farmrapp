import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { can, type Permission } from "./permissions";
import { signSession, verifySessionToken, type SessionPayload } from "./session-token";

const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string, username: string) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = signSession({ userId, username, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

// The signed cookie only proves who the user is. Role and active status are
// read fresh from the database on every request, so an admin changing a
// user's profile or deactivating them takes effect immediately.
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, name: true, role: true, active: true },
  });
  // A still-valid cookie for a deleted or deactivated user: /logout clears it
  // (a page can't modify cookies itself) and sends them back to /login.
  if (!user || !user.active) redirect("/logout");
  return user;
});

// For pages: send users without access back to the dashboard.
export async function requirePagePermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!can(user.role, permission)) redirect("/");
  return user;
}
