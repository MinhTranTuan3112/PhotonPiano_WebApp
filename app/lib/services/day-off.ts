import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export async function fetchDayOffs({
    page = 1,
    pageSize = 10,
    sortColumn = "Id",
    orderByDesc = true,
    startTime,
    endTime,
    name,
    idToken
}: Partial<
    QueryPagedRequest & {
        startTime?: string;
        endTime?: string;
        name?: string;
        idToken : string
    }
>) {
    let url = `/day-offs?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (startTime) {
        url += `&start-time=${startTime}`;
    }
    if (endTime) {
        url += `&end-time=${endTime}`;
    }
    if (name) {
        url += `&name=${name}`;
    }

    const response = await axiosInstance.get(url, {
        headers : {
            Authorization : `Bearer ${idToken}`
        }
    });

    return response;
}
