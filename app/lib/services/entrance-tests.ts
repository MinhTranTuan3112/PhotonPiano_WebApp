import { ImportResultsFormData } from "~/routes/import-entrance-test-result";
import { UpdateEntranceTest } from "../types/entrance-test/entrance-test";
import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";
import { CreateEntranceTestFormData } from "../utils/schemas";

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

export async function fetchAnEntranceTest({ id, idToken }: {
    id: string,
    idToken: string
}) {

    const response = await axiosInstance.get(`/entrance-tests/${id}`, {
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
    endDate?: string,
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

export async function fetchCreateEntranceTest({
    idToken, studentIds = [], ...data
}: {
    idToken: string;
    studentIds?: string[];
    date: string
} & Omit<CreateEntranceTestFormData, 'date'>) {

    const response = await axiosInstance.post('/entrance-tests', { ...data, studentIds }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;
}

export async function fetchUpdateEntranceTest({
    idToken,
    id,
    ...data
}: UpdateEntranceTest & { idToken: string }) {

    const response = await axiosInstance.put(`/entrance-tests/${id}`, { ...data }, {
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

export async function fetchUpdateEntranceTestResults({
    idToken, id, studentId, ...requestData
}: {
    idToken: string,
    id: string,
    studentId: string,
    instructorComment?: string,
    levelId?: string,
    theoraticalScore?: number,
    updateScoreRequests?: {
        criteriaId: string,
        score: number
    }[]
}) {

    const response = await axiosInstance.put(`/entrance-tests/${id}/students/${studentId}/results`, { ...requestData }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;
}

export async function fetchEntranceTestStudentDetails({
    idToken, id, studentId
}: {
    id: string,
    studentId: string,
    idToken: string
}) {

    const response = await axiosInstance.get(`/entrance-tests/${id}/students/${studentId}`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;
}

export async function fetchDeleteStudentFromTest({
    idToken, entranceTestId, studentId
}: {
    idToken: string,
    entranceTestId: string,
    studentId: string
}) {

    const response = await axiosInstance.delete(`/entrance-tests/${entranceTestId}/students/${studentId}`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;
}

export async function fetchDeleteStudentsFromTest({
    idToken, entranceTestId, studentIds
}: {
    idToken: string,
    entranceTestId: string,
    studentIds: string[]
}) {

    let url = `/entrance-tests/${entranceTestId}/students?`;

    studentIds.forEach(studentId => {
        url += `studentIds=${studentId}`;

        if (studentId !== studentIds[studentIds.length - 1]) {
            url += '&';
        }
    })

    const response = await axiosInstance.delete(url, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })

    return response;
}

export async function fetchUpdateStudentsEntranceTestResults({
    idToken, entranceTestId, ...data
}: {
    idToken: string,
} & ImportResultsFormData) {

    const response = await axiosInstance.put(`/entrance-tests/${entranceTestId}/results`, { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;
}

export async function fetchAddStudentsToEntranceTest({
    idToken, entranceTestId, studentIds
}: {
    idToken: string,
    entranceTestId: string,
    studentIds: string[]
}) {

    const response = await axiosInstance.post(`/entrance-tests/${entranceTestId}/students`, { studentIds }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;

}

export async function fetchUpdateEntranceTestScoreAnnouncementStatus({
    idToken, entranceTestId, isAnnounced
}: {
    idToken: string,
    entranceTestId: string,
    isAnnounced: boolean
}) {

    const response = await axiosInstance.put(`/entrance-tests/${entranceTestId}/score-announcement-status`, { isAnnounced }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;
}

export async function fetchAvailableTeachersForEntranceTest({ page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    idToken, keyword, id
}: {
    idToken: string
    id: string
} & Partial<QueryPagedRequest & {
    keyword: string
}>) {

    const response = await axiosInstance.get(`/entrance-tests/${id}/available-teachers?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}${keyword ? `&q=${keyword}` : ''}`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;

}