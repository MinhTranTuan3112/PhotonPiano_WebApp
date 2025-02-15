import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";
import type { ErrorResponse, LinksFunction, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";

import "./tailwind.css";

import '@fontsource/montserrat';
import { Toaster } from "./components/ui/sonner";
import ErrorPage from "./components/error-page";
import { requireAuth } from "./lib/utils/auth";
import {fetchCurrentAccountInfo, fetchGoogleOAuthCallback} from "./lib/services/auth";
import { AuthResponse } from "./lib/types/auth-response";
import { getCurrentTimeInSeconds } from "./lib/utils/datetime";
import { expirationCookie, idTokenCookie, refreshTokenCookie, roleCookie } from "./lib/utils/cookie";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const meta: MetaFunction = () => {
  return [
    { title: "Photon Piano" },
    { name: "description", content: "Welcome to Photon Piano!" },
  ];
};

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {

  try {

    const { searchParams } = new URL(request.url);

    const code = searchParams.get('code') as string;

    if (!code) {
      const authData = await requireAuth(request);

      const idToken = authData.idToken;
      const currentAccount = await fetchCurrentAccountInfo({idToken});

      return {
        role: authData.role,
        currentAccountFirebaseId: currentAccount.data.accountFirebaseId
      };
    }

    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const callbackResponse = await fetchGoogleOAuthCallback(code, baseUrl);

    const { idToken, refreshToken, expiresIn, role }: AuthResponse = await callbackResponse.data;

    const expirationTime = getCurrentTimeInSeconds() + Number.parseInt(expiresIn);

    const headers = new Headers();

    headers.append("Set-Cookie", await idTokenCookie.serialize(idToken));
    headers.append("Set-Cookie", await refreshTokenCookie.serialize(refreshToken));
    headers.append("Set-Cookie", await expirationCookie.serialize(expirationTime.toString()));
    headers.append("Set-Cookie", await roleCookie.serialize(role));

    return Response.json({ role }, { headers });

  } catch (error) {

    return null;
  }
}

export function ErrorBoundary() {
  let error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return (
      <ErrorPage error={error} />
    )
  }
  const errorInstance = error as Error
  if (errorInstance) {
    const errorData = error as ErrorResponse
    return (
      <ErrorPage error={{ status: errorData.status, statusText: errorData.statusText, data: errorInstance.message }} />
    )
  } else {
    return <h1>Unknown Error</h1>;
  }
}

const queryClient = new QueryClient();

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <link rel="icon" type="image/png" href="/piano.png" />
        <Links />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <ScrollRestoration />
          <Scripts />
          <Toaster richColors={true} theme={"light"} />
        </QueryClientProvider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />
}