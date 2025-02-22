import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export async function fetchCriterias({
    page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    idToken
}: {
    idToken: string
} & Partial<QueryPagedRequest>) {

    let url = `/criterias?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}