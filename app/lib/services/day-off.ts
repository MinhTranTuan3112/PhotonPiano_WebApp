import { CreateDayOffRequest, DayOffFormData, UpdateDayOffRequest } from "../types/day-off/day-off";
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
        idToken: string
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
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}


export async function fetchCreateDayOff({ idToken, ...data }: {
    idToken: string;
} & CreateDayOffRequest) {

    const response = await axiosInstance.post('/day-offs', { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchUpdateDayOff({ idToken, id, ...data }: {
    idToken: string;
} & UpdateDayOffRequest) {

    const response = await axiosInstance.put(`/day-offs/${id}`, { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchDeleteDayOff({ idToken, id }: {
    idToken: string;
    id: string;
}) {

    const response = await axiosInstance.delete(`/day-offs/${id}`, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}