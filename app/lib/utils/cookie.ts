
import { createCookie } from "@vercel/remix";

const cookieSecret = import.meta.env.VITE_COOKIE_SECRET;

export const idTokenCookie = createCookie("idToken", {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
    secrets: [cookieSecret],
});

export const refreshTokenCookie = createCookie("refreshToken", {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secrets: [cookieSecret],
});

export const roleCookie = createCookie("role", {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
    secrets: [cookieSecret],
});

export const accountIdCookie = createCookie("accountId", {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
    secrets: [cookieSecret],
});

export const expirationCookie = createCookie("idTokenExpiry", {
    secure: process.env.NODE_ENV === "production",
    path: "/",            // Ensures the cookie is accessible across the app
    sameSite: "lax",      // Prevents CSRF by only sending the cookie with same-site requests
    secrets: [cookieSecret],
});