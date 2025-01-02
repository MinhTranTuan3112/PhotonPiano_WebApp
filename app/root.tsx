import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";
import type { ErrorResponse, LinksFunction, MetaFunction } from "@remix-run/node";

import "./tailwind.css";

import '@fontsource/montserrat';
import { Toaster } from "./components/ui/sonner";
import ErrorPage from "./components/error-page";

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
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster richColors={true} theme={"light"} />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />
}