import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export interface TeacherClassQueryParams extends Partial<QueryPagedRequest> {
  keyword?: string;
  idToken: string;
}

export interface ClassDetailsResponse {
  id: string;
  idToken: string;
}

export interface GradeTemplateResponse {
  id: string;
  idToken: string;
}

export async function fetchTeacherClasses({
  page = 1,
  pageSize = 5,
  sortColumn = "Id",
  orderByDesc = false,
  keyword,
  idToken,
}: TeacherClassQueryParams) {
  if (!idToken) {
    throw new Error("Authentication token is required");
  }

  let url = `/classes?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;
  if (keyword) {
    url += `&keyword=${keyword}`;
  }

  const response = await axiosInstance.get(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response;
}

export async function fetchClassDetails({ id, idToken }: ClassDetailsResponse) {
  if (!idToken) {
    throw new Error("Authentication token is required");
  }
  let url = `/classes/${id}`;
  const response = await axiosInstance.get(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response;
}

export async function fetchGradeTemplate({
  id,
  idToken,
}: GradeTemplateResponse) {
  if (!idToken) {
    throw new Error("Authentication token is required");
  }
  let url = `/classes/${id}/grade-template`;
  const response = await axiosInstance.get(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    responseType: "blob",
  });
  return response;
}
