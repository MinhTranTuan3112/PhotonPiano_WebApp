import { UpdateEntranceTest } from "../types/entrance-test/entrance-test";
import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export async function fetchEntranceTests({ page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    idToken, keyword, shifts = [], roomIds = []
}: {
    idToken: string
} & Partial<QueryPagedRequest & {
    keyword: string,
    shifts: number[],
    roomIds: string[]
}>) {

    let url = `/entrance-tests?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (keyword) {
        url += `&keyword=${keyword}`;
    }

    if (shifts.length > 0) {
        shifts.forEach(shift => {
            url += `&shifts=${shift}`;
        })
    }

    if (roomIds.length > 0) {
        roomIds.forEach(roomId => {
            url += `&room-ids=${roomId}`;
        })
    }

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

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


export async function fetchAutoArrangeEntranceTests({
    startDate,
    endDate,
    shiftOptions = [],
    studentIds,
    idToken,
}: {
    startDate: string,
    endDate: string,
    shiftOptions?: number[],
    studentIds: string[],
    idToken: string
}) {

    const response = await axiosInstance.post('/entrance-tests/auto-arrangement',
        {
            startDate,
            endDate,
            shiftOptions,
            studentIds
        },
        {
            headers: {
                Authorization: `Bearer ${idToken}`,
            }
        }
    );

    return response;
}

export async function fetchUpdateEntranceTest({
    idToken,
    id,
    ...data
}: UpdateEntranceTest & { idToken: string }) {

    const response = await axiosInstance.put(`/entrance-tests/${id}`, { data }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;
}

export async function fetchDeleteEntranceTest({ id, idToken }: {
    id: string,
    idToken: string
}) {

    const response = await axiosInstance.delete(`/entrance-tests/${id}`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;
}