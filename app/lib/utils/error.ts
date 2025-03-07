import axios, { isAxiosError } from "axios";
import { ErrorDetails } from "../types/error-details";

export const getErrorDetailsInfo = (error: unknown) => {
    let errorInfo = {
        message : "",
        status : 500
    }
    if (axios.isAxiosError(error)) {
        const errorResponse: ErrorDetails = error.response?.data;
        console.log({ errorResponse });
        errorInfo.message = errorResponse ? errorResponse.detail : error.message;
        errorInfo.status = errorResponse?.status || 500;
    } else if (error instanceof Error) {
        errorInfo.message = error.message;
    } else if (error && typeof error === "object" && "message" in error) {
        errorInfo.message = String(error.message);
    } else if (typeof error === "string") {
        errorInfo.message = error;
    } else {
        errorInfo.message = "Something went wrong";
    }

    return errorInfo;
};

export const isRedirectError = (error: unknown) => {
    return (error instanceof Response && error.status >= 300 && error.status < 400);
}

export const isNetworkError = (error: unknown) => {
    return isAxiosError(error) && error.request && !error.response;
}