export type ErrorDetails = {
    type: string | null;
    title: string | null;
    status: number | null; // Assuming "integer" maps to "number" in TypeScript
    detail: string;
    instance?: string | null;
    errors?: { [key: string]: string[] } | null;
};