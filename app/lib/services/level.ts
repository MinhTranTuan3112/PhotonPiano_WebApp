import axiosInstance from "../utils/axios-instance";

export async function fetchLevels() {
    const response = await axiosInstance.get("/levels");

    return response;
}