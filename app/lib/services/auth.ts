import axiosInstance from "../utils/axios-instance";


export async function fetchSignIn(email: string, password: string) {

    const response = await axiosInstance.post('/auth/sign-in', {
        email,
        password
    });

    return response;
}

export async function fetchSignUp(email: string, password: string) {
    
    const response = await axiosInstance.post('/auth/sign-up', {
        email,
        password
    });

    return response;
}

export async function fetchRefreshToken(refreshToken: string) {

    const response = await axiosInstance.post('/auth/token-refresh', {
        refreshToken
    });

    return response;

}

export async function fetchGoogleOAuthCallback(code: string, redirectUrl: string) {

    const response = await axiosInstance.get(`/auth/google-auth-callback?code=${code}&url=${redirectUrl}`);

    return response;
}

export async function fetchSendForgotPasswordEmail(email: string) {

    const response = await axiosInstance.post('/auth/password-reset-email', {
        email
    });

    return response;
    
}