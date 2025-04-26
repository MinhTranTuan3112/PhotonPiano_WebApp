import axiosInstance from "../utils/axios-instance";

export async function fetchLevels() {
    const response = await axiosInstance.get("/levels");

    return response;
}

export async function fetchALevel({
    idToken,
    id
}: {
    id: string;
    idToken: string;
}) {

    const response = await axiosInstance.get(`/levels/${id}`, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
    
}