import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export async function fetchSurveyQuestions({
    page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true, idToken,
    keyword
}: {

} & Partial<QueryPagedRequest & {
    keyword: string
}> & {
    idToken: string
}) {

    let url = `/survey-questions?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

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