import axios, { isAxiosError } from "axios";
import { ErrorDetails } from "../types/error-details";

export const getErrorDetailsInfo = (error: unknown) => {

    let message: string;
    let status: number = 500;

    if (axios.isAxiosError(error)) {
        const errorResponse: ErrorDetails = error.response?.data;
        console.log({ errorResponse });
        message = errorResponse ? errorResponse.detail : error.message;
        status = errorResponse?.status || 500;
    } else if (error instanceof Error) {
        message = error.message;
    } else if (error && typeof error === "object" && "message" in error) {
        message = String(error.message);
    } else if (typeof error === "string") {
        message = error;
    } else {
        message = "Something went wrong";
    }

    return { message, status };
};

export const isRedirectError = (error: unknown) => {
    return (error instanceof Response && error.status >= 300 && error.status < 400);
}

export const isNetworkError = (error: unknown) => {
    return isAxiosError(error) && error.request && !error.response;
}