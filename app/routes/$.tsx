// routes/$.tsx
export function loader() {
    throw new Response('Page Not Found', { status: 404 });
}

export default function Component() {
    return null;
}