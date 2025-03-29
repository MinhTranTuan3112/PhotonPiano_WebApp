import { Level } from "../types/account/account";
import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";
import { getErrorDetailsInfo } from "../utils/error";

export async function fetchClasses({ page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    levels = [], statuses = [], isPublic 
}: Partial<QueryPagedRequest & {
    levels: string[],
    statuses: number[],
    isPublic? : boolean
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

    if (isPublic){
        url += `&is-public=${isPublic}`;
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
    level : string,
    idToken: string
}) {
    const response = await axiosInstance.post(`/classes/`,{
        levelId : level
    }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })

    return response;
}
export async function fetchUpdateClass({ id, level, name, instructorId, scheduleDescription, idToken }: {
    id : string,
    name? : string,
    instructorId? : string,
    scheduleDescription? : string,
    level? : string,
    idToken: string
}) {
    const response = await axiosInstance.put(`/classes/`,{
        levelId : level,
        id : id,
        name : name,
        instructorId : instructorId,
        scheduleDescription : scheduleDescription
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
export async function fetchClearScheduleClass({id, idToken }: {
    id : string
    idToken: string
}) {
    const response = await axiosInstance.delete(`/classes/${id}/schedule`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })

    return response;
}
export async function fetchPublishAClass({id, idToken }: {
    id : string
    idToken: string
}) {
    const response = await axiosInstance.patch(`/classes/${id}/publishing`, {}, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })

    return response;
}

export async function fetchChangeAClass({oldClassId, newClassId, studentId, idToken }: {
    oldClassId : string,
    newClassId : string,
    studentId : string,
    idToken: string
}) {
    const response = await axiosInstance.put(`/classes/student-class`, {
        oldClassId : oldClassId,
        newClassId : newClassId,
        studentFirebaseId : studentId
    }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })

    return response;
}