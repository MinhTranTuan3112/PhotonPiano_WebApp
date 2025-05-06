import { getCurrentTimeInSeconds } from "./datetime";
import { accountIdCookie, expirationCookie, idTokenCookie, refreshTokenCookie, roleCookie } from "./cookie";
import { fetchRefreshToken } from "../services/auth";
import { AuthResponse } from "../types/auth-response";
import { redirect } from "@remix-run/node";


interface AuthData {
  idToken?: string
  refreshToken?: string
  idTokenExpiry?: number
  role?: number
}

// Calculate expiration timestamp in milliseconds
function calculateExpiry(expiresIn: number): number {
  return Date.now() + expiresIn * 1000; // converts seconds to milliseconds
}

async function parseAuthData(input: Request | AuthData): Promise<AuthData> {
  if (input instanceof Request) {
    const cookies = input.headers.get("Cookie") || ""
    return {
      idToken: (await idTokenCookie.parse(cookies)) as string,
      refreshToken: (await refreshTokenCookie.parse(cookies)) as string,
      idTokenExpiry: Number.parseInt((await expirationCookie.parse(cookies)) || "0"),
      role: (await roleCookie.parse(cookies)) as number,
    }
  } else {
    return input
  }
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
  const role = await roleCookie.parse(cookies) as number;
  const accountId = await accountIdCookie.parse(cookies) as string;

  console.log({ refreshToken });

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
        role,
        accountId: newTokens.accountId,
        headers: newTokens.headers
      };
    } else {
      console.log("Failed to refresh token, redirecting to /sign-in");
      throw redirect("/sign-in");
    }
  }
  return { idToken, refreshToken, role, accountId };
}

export async function getAuth(request: Request) {

  const cookies = request.headers.get("Cookie") || "";

  const idToken = await idTokenCookie.parse(cookies) as string;
  const refreshToken = await refreshTokenCookie.parse(cookies) as string;
  const idTokenExpiry = parseInt(await expirationCookie.parse(cookies) || "0");
  const role = await roleCookie.parse(cookies) as number;
  const accountId = await accountIdCookie.parse(cookies) as string;

  if ((!idToken || isExpired(idTokenExpiry)) && !!refreshToken) {
    console.log("ID token missing or expired, attempting to refresh");

    const newTokens = await refreshIdToken(refreshToken);
    if (newTokens) {
      return {
        idToken: newTokens.idToken,
        role,
        idTokenExpiry,
        accountId: newTokens.accountId,
        headers: newTokens.headers
      };
    } else return { idToken, refreshToken, idTokenExpiry, role, accountId };
  }

  return { idToken, refreshToken, idTokenExpiry, role, accountId };
}

export async function refreshIdToken(refreshToken: string) {
  const response = await fetchRefreshToken(refreshToken);


  try {

    const { idToken, refreshToken: newRefreshToken, expiresIn, role, userId }: AuthResponse & {
      userId: string
    } = await response.data;

    const expirationTime = getCurrentTimeInSeconds() + Number.parseInt(expiresIn);

    const headers = new Headers();
    headers.append("Set-Cookie", await idTokenCookie.serialize(idToken));
    // headers.append("Set-Cookie", await refreshTokenCookie.serialize(newRefreshToken));
    headers.append("Set-Cookie", await expirationCookie.serialize(expirationTime.toString()));
    headers.append("Set-Cookie", await roleCookie.serialize(role));
    headers.append("Set-Cookie", await accountIdCookie.serialize(userId));

    return {
      idToken, // Return new idToken
      // refreshToken: newRefreshToken, // Return new refreshToken
      expiresIn,
      role,
      accountId: userId,
      headers
    };

  } catch (error) {
    console.error("Failed to refresh token", error);
    return null;
  }

}
