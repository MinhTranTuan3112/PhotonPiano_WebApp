import { CreateArticleRequest, UpdateArticleRequest } from "../types/news/article";
import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export async function fetchArticles({
    page, pageSize, sortColumn, orderByDesc,
    keyword
}: {
} & Partial<QueryPagedRequest & {
    keyword: string
}>) {
    let url = `/articles?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (keyword) {
        url += `&q=${keyword}`;
    }

    const response = await axiosInstance.get(url);

    return response;
}

export async function fetchArticleBySlug({
    slug
}: {
    slug: string
}) {

    const response = await axiosInstance.get(`/articles/${slug}`);

    return response;
}

export async function fetchCreateArticle({
    idToken,
    ...data
}: {
    idToken: string
} & CreateArticleRequest) {

    const response = await axiosInstance.post(`/articles`, { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchUpdateArticle({
    idToken,
    slug,
    ...data
}: {
    idToken: string
} & UpdateArticleRequest) {

    const response = await axiosInstance.put(`/articles/${slug}`, { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchDeleteArticle({
    idToken,
    id
}: {
    idToken: string;
    id: string;
}) {

    const response = await axiosInstance.delete(`/articles/${id}`, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
    
}