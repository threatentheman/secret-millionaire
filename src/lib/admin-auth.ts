import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "secret-millionaire-admin";
const ADMIN_EMAIL = "jasmineibikunle@hotmail.co.uk";
const ADMIN_PASSWORD = "Moji1234";

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "secret-millionaire-admin-session";
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function adminToken() {
  return hashValue(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}:${sessionSecret()}`);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function isAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  return token ? safeEqual(token, adminToken()) : false;
}

export async function requireAdminSession() {
  if (!(await isAdminSession())) {
    redirect("/admin/login");
  }
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 12
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 0
  });
}

export function validateAdminCredentials(email: string, password: string) {
  return email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

export function validateAdminPassword(password: string) {
  return password === ADMIN_PASSWORD;
}
