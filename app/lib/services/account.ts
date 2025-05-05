import { Level, Role, StudentStatus, UpdateAccountRequest } from "../types/account/account";
import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export async function fetchAccounts({
    page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    levels = [], roles = [], studentStatuses = [], q, accountStatus = [],
    idToken
}:
    Partial<QueryPagedRequest & {
        levels: string[];
        roles: Role[];
        q?: string;
        studentStatuses: StudentStatus[];
        accountStatus : number[];
    }> & {
        idToken: string
    }
) {

    let url = `/accounts?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (q) {
        url += `&q=${q}`
    }

    if (levels.length > 0) {
        levels.forEach(level => {
            url += `&levels=${level}`;
        })
    }

    if (roles.length > 0) {
        roles.forEach(role => {
            url += `&roles=${role}`;
        })
    }

    if (studentStatuses.length > 0) {
        studentStatuses.forEach(status => {
            url += `&student-statuses=${status}`;
        })
    }

    if (accountStatus.length > 0) {
        accountStatus.forEach(status => {
            url += `&statuses=${status}`;
        })
    }

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchUpdateAccountInfo({
    idToken,
    request
}: {
    idToken: string;
    request: UpdateAccountRequest
}) {
    
    const response = await axiosInstance.put('/accounts', { ...request }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchWaitingStudentsOfAllLevel({idToken} : {idToken : string}) {

    const response = await axiosInstance.get("/accounts/class-waiting", {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchTeachDetail(id : string, idToken : string) {

    let url = `/accounts/${id}/teacher`;

    const response = await axiosInstance.get(url, {
        headers : {
            Authorization : `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchTeachers({
    page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    levels = [], q, accountStatus = [],
}:
    Partial<QueryPagedRequest & {
        levels: string[];
        q?: string;
        accountStatus : number[];
    }>
) {

    let url = `/accounts/teachers?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (q) {
        url += `&q=${q}`
    }

    if (levels.length > 0) {
        levels.forEach(level => {
            url += `&levels=${level}`;
        })
    }

    if (accountStatus.length > 0) {
        accountStatus.forEach(status => {
            url += `&statuses=${status}`;
        })
    }

    const response = await axiosInstance.get(url);

    return response;
}

export async function fetchAccountDetail(id : string, idToken : string) {

    let url = `/accounts/${id}`;

    const response = await axiosInstance.get(url, {
        headers : {
            Authorization : `Bearer ${idToken}`
        }
    });
    console.log(response.data)
    return response;
}

export async function fetchCreateStaff({
    idToken, fullName, email, phone
    
}: {
    idToken: string;
    fullName : string,
    email : string,
    phone : string
}) {
    
    const response = await axiosInstance.post('/accounts/staff', {
        fullName, email, phone
     }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}
export async function fetchCreateTeacher({
    idToken, fullName, email, phone
    
}: {
    idToken: string;
    fullName : string,
    email : string,
    phone : string
}) {
    
    const response = await axiosInstance.post('/accounts/teacher', {
        fullName, email, phone
     }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}