export type AuthResponse = {
    displayName: string | null;
    email: string;
    expiresIn: string;
    idToken: string
    kind: string;
    localId: string;
    refreshToken: string;
    registered?: boolean;
    role: string;
};