
import { redirect } from "@vercel/remix";
import { getCurrentTimeInSeconds } from "./datetime";
import { expirationCookie, idTokenCookie, refreshTokenCookie, roleCookie } from "./cookie";
import { fetchRefreshToken } from "../services/auth";
import { AuthResponse } from "../types/auth-response";

// Calculate expiration timestamp in milliseconds
function calculateExpiry(expiresIn: number): number {
    return Date.now() + expiresIn * 1000; // converts seconds to milliseconds
}

function isExpired(expirationTimeInSeconds: number) {

    console.log({ expirationTimeInSeconds });

    if (!expirationTimeInSeconds) {
        return true;
    }

    const currentTime = getCurrentTimeInSeconds();

    return currentTime >= expirationTimeInSeconds;
}

export async function requireAuth(request: Request) {

    const cookies = request.headers.get("Cookie") || "";

    const idToken = await idTokenCookie.parse(cookies) as string;
    const refreshToken = await refreshTokenCookie.parse(cookies) as string;
    const idTokenExpiry = parseInt(await expirationCookie.parse(cookies) || "0");
    const role = await roleCookie.parse(cookies) as string;

    // Redirect if no refresh token is present (not logged in)
    if (!refreshToken) {
        console.log("No refresh token, redirecting to /sign-in");
        throw redirect("/sign-in");
    }

    // If idToken is missing or expired, try refreshing it
    if (!idToken || isExpired(idTokenExpiry)) {
        console.log("ID token missing or expired, attempting to refresh");

        const newTokens = await refreshIdToken(refreshToken);
        if (newTokens) {
            return {
                idToken: newTokens.idToken,
                refreshToken: newTokens.refreshToken,
                role,
            };
        } else {
            console.log("Failed to refresh token, redirecting to /sign-in");
            throw redirect("/sign-in");
        }
    }

    return { idToken, refreshToken, role };
}

export async function getAuth(request: Request) {
    const cookies = request.headers.get("Cookie") || "";

    const idToken = await idTokenCookie.parse(cookies) as string;
    const refreshToken = await refreshTokenCookie.parse(cookies) as string;
    const idTokenExpiry = parseInt(await expirationCookie.parse(cookies) || "0");
    const role = await roleCookie.parse(cookies) as string;

    return { idToken, refreshToken, idTokenExpiry, role };
}


export async function refreshIdToken(refreshToken: string) {

    const response = await fetchRefreshToken(refreshToken);

    try {

        const { idToken, refreshToken: newRefreshToken, expiresIn }: AuthResponse = await response.data;

        const headers = new Headers();
        headers.append("Set-Cookie", await idTokenCookie.serialize(idToken));
        headers.append("Set-Cookie", await refreshTokenCookie.serialize(newRefreshToken));
        headers.append("Set-Cookie", await expirationCookie.serialize(expiresIn));

        return {
            idToken, // Return new idToken
            refreshToken: newRefreshToken, // Return new refreshToken
            headers
        };

    } catch (error) {
        console.error("Failed to refresh token", error);
        return null;
    }

}