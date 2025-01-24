import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { expirationCookie, idTokenCookie, refreshTokenCookie, roleCookie } from "~/lib/utils/cookie";

export async function action({ }: ActionFunctionArgs) {
    
    const headers = new Headers();
    headers.append("Set-Cookie", await idTokenCookie.serialize("", { maxAge: 0 }));
    headers.append("Set-Cookie", await refreshTokenCookie.serialize("", { maxAge: 0 }));
    headers.append("Set-Cookie", await expirationCookie.serialize("", { maxAge: 0 }));
    headers.append("Set-Cookie", await roleCookie.serialize("", { maxAge: 0 }));

    return redirect("/sign-in", {
        headers
    });
}