import { QueryPagedRequest } from "../types/query/query-paged-request";
import { CreateSurveyQuestionRequest, UpdateSurveyQuestionRequest } from "../types/survey-question/survey-question";
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

export async function fetchAQuestion({
    id, idToken
}: {
    id: string;
    idToken: string
}) {

    const response = await axiosInstance.get(`/survey-questions/${id}`, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchQuestionAnswers({
    questionId, idToken,
    page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true
} : {
    questionId: string
    idToken: string
} & Partial<QueryPagedRequest>) {
    
    let url = `/survey-questions/${questionId}/answers?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchCreateQuestion({
    idToken, ...data
}: {
    idToken: string
} & CreateSurveyQuestionRequest) {

    const response = await axiosInstance.post('/survey-questions', { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchUpdateQuestion({ 
    idToken, id, ...data
}: {
    idToken: string
} & UpdateSurveyQuestionRequest) {
    const response = await axiosInstance.put(`/survey-questions/${id}`, { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchDeleteQuestion({ 
    idToken, id
}: {
    idToken: string
    id: string
}) {

    const response = await axiosInstance.delete(`/survey-questions/${id}`, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;

}