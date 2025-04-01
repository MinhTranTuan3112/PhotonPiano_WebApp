import { CreateFreeSlot } from "../types/free-slot/free-slot";
import axiosInstance from "../utils/axios-instance";

export async function fetchFreeSlots({idToken }: {
    idToken: string
}) {

    const response = await axiosInstance.get(`/free-slots`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;
}

export async function fetchUpsertFreeSlot({ idToken, createFreeSlotModels }: {
    idToken: string,
    createFreeSlotModels : CreateFreeSlot[]
}) {

    const response = await axiosInstance.post(`/free-slots`, {
        createFreeSlotModels
    }, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;
}