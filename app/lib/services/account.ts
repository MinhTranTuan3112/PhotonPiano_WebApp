import { Level, Role, StudentStatus } from "../types/account/account";
import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export async function fetchAccounts({
    page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    levels = [], roles = [], studentStatuses = [], q,
    idToken
}:
    Partial<QueryPagedRequest & {
        levels: Level[];
        roles: Role[];
        q? : string;
        studentStatuses: StudentStatus[];
    }> & {
        idToken: string
    }
) {

    let url = `/accounts?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (q)
    {
        url += `&q=${q}`
    }

    if (levels.length > 0) {
        levels.forEach(level => {
            url += `&levels=${level}`;
        })
    }

    if (roles.length > 0) {
        roles.forEach(role => {
            url += `&roles=${role}`;
        })
    }

    if (studentStatuses.length > 0) {
        studentStatuses.forEach(status => {
            url += `&student-statuses=${status}`;
        })
    }

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}