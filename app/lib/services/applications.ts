import { ApplicationStatus, ApplicationType } from "../types/application/application";
import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export async function fetchApplications({
    page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    q, types = [], statuses = [],
    idToken
}:
    Partial<QueryPagedRequest & {
        q: string,
        types: ApplicationType[];
        statuses: ApplicationStatus[];
    }> & {
        idToken: string
    }
) {

    let url = `/applications?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (q)
    {
        url += `&q=${q}`
    }

    if (types.length > 0) {
        types.forEach(type => {
            url += `&types=${type}`;
        })
    }

    if (statuses.length > 0) {
        statuses.forEach(status => {
            url += `&statuses=${status}`;
        })
    }

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}