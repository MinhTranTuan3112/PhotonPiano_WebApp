import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export async function fetchClasses({ page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    levels = [], statuses = [] 
}: Partial<QueryPagedRequest & {
    levels: number[],
    statuses: number[]
}>) {

    let url = `/classes?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (levels.length > 0) {
        levels.forEach(level => {
            url += `&levels=${level}`;
        })
    }

    if (statuses.length > 0) {
        statuses.forEach(status => {
            url += `&statuses=${status}`;
        })
    }

    const response = await axiosInstance.get(url);

    return response;
}

export async function fetchClassDetail(id : string) {

    let url = `/classes/${id}`;

    const response = await axiosInstance.get(url);

    return response;
}

export async function fetchDeleteStudentClass({ studentId, classId, isExpelled = false, idToken }: {
    studentId: string,
    classId : string,
    isExpelled? : boolean
    idToken: string
}) {

    const response = await axiosInstance.delete(`/classes/student-class?studentId=${studentId}&classId=${classId}&isExpelled=${isExpelled}`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;
}