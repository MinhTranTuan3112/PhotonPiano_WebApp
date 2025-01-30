import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export async function fetchEntranceTests({ page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true }: {

} & Partial<QueryPagedRequest>) {

    let url = `/entrance-tests?page=${page}&pageSize=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    const response = await axiosInstance.get(url);

    return response;
}

export async function fetchEnrollInEntranceTest({ idToken, returnUrl }: { idToken: string; returnUrl: string }) {
    const response = await axiosInstance.post(
        '/entrance-tests/enrollment-requests',
        { returnUrl }, // This is the request body
        {
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        }
    );

    return response;
}
