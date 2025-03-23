import axiosInstance from "~/lib/utils/axios-instance";
import {Shift, SlotDetail, SlotStatus} from "~/lib/types/Scheduler/slot";
import axios from "axios";
import { isErrorResponse } from "@remix-run/react/dist/data";

export type FetchSlotsParams = {
    startTime?: string;
    endTime?: string;
    shifts?: Shift[];
    slotStatuses?: SlotStatus[];
    instructorFirebaseIds?: string[];
    studentFirebaseId?: string;
    classIds?: string[];
    idToken: string;
};


export async function fetchSlots({
                                     startTime,
                                     endTime,
                                     shifts,
                                     slotStatuses,
                                     instructorFirebaseIds,
                                     studentFirebaseId,
                                     classIds,
                                     idToken
                                 }: FetchSlotsParams) {
    try {
        const params = new URLSearchParams();

        if (startTime) params.append("start-time", startTime);
        if (endTime) params.append("end-time", endTime);
        // Handle list parameters
        if (shifts?.length) {
            shifts.forEach((shift) => params.append("shifts", shift.toString()))
        }
        if (slotStatuses?.length) {
            slotStatuses.forEach((status) => params.append("slot-statuses", status.toString()))
        }
        if (instructorFirebaseIds?.length) {
            instructorFirebaseIds.forEach((id) => params.append("instructor-firebase-ids", id))
        }
        if (classIds?.length) {
            classIds.forEach((id) => params.append("class-ids", id))
        }

        if (studentFirebaseId) params.append("student-firebase-id", studentFirebaseId)

        const url = `/scheduler/slots?${params.toString()}`

        const response = await axiosInstance.get(url, {
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        })


        return response;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`API Error: ${error.response.data?.message || error.message}`);
        } else {
            throw new Error(`Unexpected Error: ${(error as Error).message}`);
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


export async function fetchUpdateAttendanceStatus(
    slotId: string,
    slotStudentInfoModels: {
        StudentId: string;
        AttendanceComment: string | undefined;
        GestureComment: string | undefined;
        GestureUrl: string | undefined;
        FingerNoteComment: string | undefined;
        PedalComment: string | undefined;
        AttendanceStatus: number; // 0: NotYet, 1: Attended, 2: Absent
    }[],
    idToken: string
) {
    try {
        const url = `/scheduler/update-attendance`;
        const response = await axiosInstance.post(url, {
            SlotId: slotId,
            SlotStudentInfoRequests: slotStudentInfoModels.length > 0 ? slotStudentInfoModels : undefined,
        }, {
            headers: {
                "Authorization": `Bearer ${idToken}`,
                "Content-Type": "application/json",
            },
        });

        if (response.status !== 200) {
            throw new Error(`API Error: Status ${response.status} - ${response.statusText}`);
        }
        
        return response;
    } catch (error: unknown) {
        console.error("Error in fetchUpdateAttendanceStatus:", error);
        if (axios.isAxiosError(error) && error.response) {
            console.log("Error response data:", error.response.data);
            throw new Error(`API Error: ${error.response.data?.message || error.message}`);
        } else {
            throw new Error(`Unexpected Error: ${(error as Error).message}`);
        }
    }
}


export async function fetchCancelSlot( slotId: string, cancelReason: string, idToken: string) {
   
    const url = '/scheduler/cancel-slot';

    console.log("Go to here");
    
    const response = await axiosInstance.post(url, {
        slotId: slotId,
        cancelReason: cancelReason,
    }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })
    
    if (response.status != 204) {
        throw new Error(`Failed to cancel slot: ${response.statusText}`);
    }
    return response; // API trả về 204 No Content
}

export async function fetchBlankSlots( startDate: string, endDate: string, idToken: string) {

    const url = '/scheduler/blank-slot';

    const response = await axiosInstance.post(url, {
        startDate: startDate,
        endDate: endDate,
    }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })

    if (response.status != 200) {
        throw new Error(`Failed to cancel slot: ${response.statusText}`);
    }
    return response; 
}

export async function fetchPublicNewSlot(
    roomId: string,
    date: string,
    shift: Shift,
    classId: string,
    idToken: string
) {
    const url = '/scheduler/public-new-slot';

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error("Invalid date format. Expected format: YYYY-MM-DD");
    }

    console.log("Sending request to fetchPublicNewSlot:", {
        roomId,
        date,
        shift,
        classId,
        idToken: idToken ? "Provided" : "Missing",
    });

    const fullUrl = axiosInstance.getUri({ url });
    console.log("Full URL for fetchPublicNewSlot:", fullUrl);

    try {
        const response = await axiosInstance.post(url, {
            roomId: roomId,
            date: date,
            shift: shift,
            classId: classId,
        }, {
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        });

        console.log("fetchPublicNewSlot response:", response);

        if (response.status !== 200) {
            throw new Error(`Failed to create new slot: ${response.statusText}`);
        }

        return response;
    } catch (error) {
        console.error("fetchPublicNewSlot error:", error);
        throw error;
    }
}


export async function fetchCreateSlot({ shift, date, roomId, classId, idToken }: {
    shift : number,
    date : string,
    roomId : string,
    classId : string,
    idToken : string
}) {
    const response = await axiosInstance.post(`/scheduler`, {
        shift : shift,
        date : date,
        roomId : roomId,
        classId : classId,
        idToken : idToken
    },{
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })
    return response;
}

export async function fetchUpdateSlot({ id, shift, date, roomId, reason, idToken }: {
    id : string,
    shift? : number,
    date? : string,
    roomId? : string,
    reason? : string,
    idToken : string
}) {
    const response = await axiosInstance.put(`/scheduler`, {
        id : id,
        shift : shift,
        date : date,
        roomId : roomId,
        reason : reason
    },{
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })
    return response;
}

export async function fetchDeleteSlot({ id, idToken }: {
    id : string,
    idToken : string
}) {
    const response = await axiosInstance.delete(`/scheduler/${id}`,{
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })
    return response;
}