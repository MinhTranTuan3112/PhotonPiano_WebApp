import axiosInstance from "~/lib/utils/axios-instance";

export async function fetchSlots({
                                     startTime,
                                     endTime,
                                     shifts,
                                     slotStatuses,
                                     instructorFirebaseId,
                                     studentFirebaseId,
                                     idToken
                                 }: Partial<{
    startTime: string,
    endTime: string,
    shifts: string[],
    slotStatuses: string[],
    instructorFirebaseId: string,
    studentFirebaseId: string,
    idToken: string
}>) {
    try {
        let url = `/scheduler/slots?`;

        if (startTime) url += `start-time=${startTime}&`;
        if (endTime) url += `end-time=${endTime}&`;
        if (shifts) url += `shifts=${shifts.join(',')}&`;
        if (slotStatuses) url += `slot-statuses=${slotStatuses.join(',')}&`;
        if (instructorFirebaseId) url += `instructor-firebase-id=${instructorFirebaseId}&`;
        if (studentFirebaseId) url += `student-firebase-id=${studentFirebaseId}&`;

        // Remove the trailing '&' or '?' if present
        url = url.slice(0, -1);

        const response = await axiosInstance.get(url, {
            headers: {
                Authorization: `Bearer ${idToken}`
        },
        });

        return response;
    } catch (error : any) {
        if (error.response) {
            // Handle Axios-specific errors
            throw new Error(`API Error: ${error.response.data?.message || error.message}`);
        } else {
            // Handle other errors
            throw new Error(`Unexpected Error: ${error.message}`);
        }
    }
}

export async function fetchSlotById(id: string, idToken: string) {
    try {
        const url = `/scheduler/slot/${id}`;
        const response = await axiosInstance.get(url, {
            headers: {
                Authorization: `Bearer ${idToken}`
            },
        });


        return response;
    } catch (error : any) {
        if (error.response) {
            throw new Error(`API Error: ${error.response.data?.message || error.message}`);
        } else {
            throw new Error(`Unexpected Error: ${error.message}`);
        }
    }
}


export async function fetchAttendanceStatus(slotId: string, idToken: string) {
    try {
        const url = `/scheduler/attendance-status/${slotId}`;

        const response = await axiosInstance.get(url, {
            headers: {
                Authorization: `Bearer ${idToken}`
            },
        });

        return response;
    } catch (error: any) {
        if (error.response) {
            throw new Error(`API Error: ${error.response.data?.message || error.message}`);
        } else {
            throw new Error(`Unexpected Error: ${error.message}`);
        }
    }
}


export async function fetchUpdateAttendanceStatus(slotId: string, StudentAttentIds: string[], StudentAbsentIds: string[],  idToken: string) {

    try {
        const url = `/scheduler/update-attendance`;

        console.log(slotId);

        const response = await axiosInstance.post(url, {
            slotId,
            StudentAttentIds,
            StudentAbsentIds
        }, {
            headers: {
                Authorization: `Bearer ${idToken}`
            },
        });

        return response;
    }catch (error: any) {
        if (error.response) {
            throw new Error(`API Error: ${error.response.data?.message || error.message}`);
        } else {
            throw new Error(`Unexpected Error: ${error.message}`);
        }
    }
}