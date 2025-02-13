import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from './constants';
import https from 'https';

let axiosInstance: AxiosInstance;

if (typeof window === 'undefined') {
    // Node.js environment (server-side)
    axiosInstance = axios.create({
        baseURL: `${API_BASE_URL}/api`,
        timeout: 10000,
        httpsAgent: new https.Agent({
            rejectUnauthorized: process.env.VITE_IS_DEVELOPMENT === 'true' ? false : true,
        }),
    });
} else {
    // Browser environment
    axiosInstance = axios.create({
        baseURL: `${API_BASE_URL}/api`,
        timeout: 10000,
    });
}


export default axiosInstance;