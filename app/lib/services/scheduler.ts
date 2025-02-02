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

        if (startTime) url += `startTime=${startTime}&`;
        if (endTime) url += `endTime=${endTime}&`;
        if (shifts) url += `shifts=${shifts.join(',')}&`;
        if (slotStatuses) url += `slotStatuses=${slotStatuses.join(',')}&`;
        if (instructorFirebaseId) url += `instructorFirebaseId=${instructorFirebaseId}&`;
        if (studentFirebaseId) url += `studentFirebaseId=${studentFirebaseId}&`;

        // Remove the trailing '&' or '?' if present
        url = url.slice(0, -1);

        const response = await axiosInstance.get(url, {
            headers: {
                Authorization: `Bearer ${idToken}`
        },
        });

        console.log("url: ", url);
        console.log("data: ", response.data);

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

export async function fetchSlotById(id: string) {
    try {
        const response = await axiosInstance.get(`/scheduler/slot/${id}`);

        console.log("data: ", response.data);

        return response.data;
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


        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(`API Error: ${error.response.data?.message || error.message}`);
        } else {
            throw new Error(`Unexpected Error: ${error.message}`);
        }
    }
}