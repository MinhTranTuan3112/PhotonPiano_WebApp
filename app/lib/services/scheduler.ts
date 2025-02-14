import axiosInstance from "~/lib/utils/axios-instance";
import {Shift, SlotStatus} from "~/lib/types/Scheduler/slot";
import axios from "axios";

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