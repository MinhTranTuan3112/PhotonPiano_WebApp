import { QueryPagedRequest } from "../types/query/query-paged-request";
import { CreateSurveyRequest } from "../types/survey/survey";
import axiosInstance from "../utils/axios-instance";

export async function fetchSurveys({
    page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    idToken
}: Partial<QueryPagedRequest & {

}> & {
    idToken: string
}) {
    let url = `/piano-surveys?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

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

    const response = await axiosInstance.post('/piano-surveys', { data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}