import axios from 'axios';
import https from 'https';
import { API_BASE_URL } from './constants';

const axiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 10000,
});

export default axiosInstance;