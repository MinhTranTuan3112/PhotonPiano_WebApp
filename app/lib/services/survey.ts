import { QueryPagedRequest } from "../types/query/query-paged-request";
import { CreateSurveyRequest, UpdateSurveyRequest } from "../types/survey/survey";
import axiosInstance from "../utils/axios-instance";

export async function fetchSurveys({
    page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    keyword,
    idToken
}: Partial<QueryPagedRequest & {
    keyword: string
}> & {
    idToken: string
}) {
    let url = `/piano-surveys?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (keyword) {
        url += `&q=${keyword}`;
    }

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchCreateSurvey({ idToken, ...data }: {
    idToken: string
} & CreateSurveyRequest) {

    const response = await axiosInstance.post('/piano-surveys', { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchASurvey({
    id,
    idToken
}: {
    id: string;
    idToken: string;
}) {
    const response = await axiosInstance.get(`/piano-surveys/${id}`, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchUpdateSurvey({
    id, idToken, ...data
}: {
    id: string;
    idToken: string;
} & UpdateSurveyRequest) {
    
    const response = await axiosInstance.put(`/piano-surveys/${id}`, { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}