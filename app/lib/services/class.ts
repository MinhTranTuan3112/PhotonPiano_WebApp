import { Level } from "../types/account/account";
import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";
import { getErrorDetailsInfo } from "../utils/error";

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

export async function fetchClassDetail(id : string, idToken : string) {

    let url = `/classes/${id}`;

    const response = await axiosInstance.get(url, {
        headers : {
            Authorization : `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchClassScoreboard(id : string, idToken : string) {

    let url = `/classes/${id}/scoreboard`;

    const response = await axiosInstance.get(url, {
        headers : {
            Authorization : `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchAddStudentsToClass({ studentFirebaseIds, classId, isAutoFill = false, idToken }: {
    studentFirebaseIds: string[],
    classId : string,
    isAutoFill? : boolean
    idToken: string
}) {

    const response = await axiosInstance.post(`/classes/student-class`,{
        classId : classId,
        isAutoFill : isAutoFill,
        studentFirebaseIds : studentFirebaseIds
    }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })

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
    })

    return response;
}

export async function fetchCreateClass({ level, idToken }: {
    level : Level,
    idToken: string
}) {
    const response = await axiosInstance.post(`/classes/`,{
        level : level
    }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })

    return response;
}
export async function fetchUpdateClass({ id, level, name, instructorId, idToken }: {
    id : string,
    name? : string,
    instructorId? : string,
    level? : Level,
    idToken: string
}) {
    const response = await axiosInstance.put(`/classes/`,{
        level : level,
        id : id,
        name : name,
        instructorId : instructorId,
    }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })

    return response;
}
export async function fetchDeleteClass({id, idToken }: {
    id : string
    idToken: string
}) {
    const response = await axiosInstance.delete(`/classes/${id}`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })

    return response;
}
export async function fetchSchduleAClass({ id, startWeek, shift, dayOfWeeks, idToken }: {
    id : string,
    startWeek : string,
    dayOfWeeks : number[],
    shift : number,
    idToken: string
}) {
    const response = await axiosInstance.patch(`/classes/scheduling`,{
        startWeek : startWeek,
        id : id,
        shift : shift,
        dayOfWeeks : dayOfWeeks,
    }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })

    return response;
}

export async function fetchAutoArrange({ studentNumber, shifts, startWeek, idToken }: {
    startWeek : string,
    studentNumber? : number,
    shifts : number[],
    idToken: string
}) {
    const response = await axiosInstance.post(`/classes/auto-arrangement`,{
        startWeek : startWeek,
        studentNumber : studentNumber,
        allowedShifts : shifts,
    }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })

    return response;
}