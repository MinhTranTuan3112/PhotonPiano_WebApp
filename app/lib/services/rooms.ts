import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export async function fetchRooms({ page = 1, pageSize = 5, sortColumn = 'Id', orderByDesc = false,
    keyword, idToken
}: Partial<{
    keyword: string
} & QueryPagedRequest> & {
    idToken: string
}) {

    let url = `/rooms?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (keyword) {
        url += `&keyword=${keyword}`;
    }

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });
    
    return response;
}

