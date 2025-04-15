import {QueryPagedRequest} from "~/lib/types/query/query-paged-request";
import axiosInstance from "~/lib/utils/axios-instance";

export async function fetchTuition({ page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
                                       idToken, studentClassIds = [], startTime, endTime, paymentStatuses
                                   }: {
    idToken: string
} & Partial<QueryPagedRequest & {
    studentClassIds: string[],
    startTime: string | null,
    endTime: string | null,
    paymentStatuses: number[],
}>) {

    const params  = new URLSearchParams();

    if(studentClassIds?.length ) {
        studentClassIds.forEach((studentClass) => params.append("student-class-ids", studentClass.toString()))
    }

    if(startTime) params.append("start-date", startTime);
    if(endTime) params.append("end-date", endTime);

    if(paymentStatuses?.length ) {
        paymentStatuses.forEach((paymentStatus) => params.append("payment-statuses", paymentStatus.toString()))
    }


    const url = `/tuitions?${params.toString()}`


    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });


    return response;
}

export async function fetchPayTuition(tuitionId: string, returnUrl:string, idToken:string ) {

    const response = await axiosInstance.post(`/tuitions/tuition-fee/`,
        {
            tuitionId,
            returnUrl
        },

        {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });


    return response;
}

