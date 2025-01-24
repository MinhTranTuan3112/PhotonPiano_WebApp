import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from './constants';

let axiosInstance: AxiosInstance;

if (typeof window === 'undefined') {
    // Node.js environment (server-side)
    const https = await import('https'); // Dynamically import https module
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