import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export interface TeacherClassQueryParams extends Partial<QueryPagedRequest> {
  keyword?: string;
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
