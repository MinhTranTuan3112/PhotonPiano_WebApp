import { QueryPagedRequest } from "../types/query/query-paged-request";
import { CreateRoomRequest, UpdateRoomRequest } from "../types/room/room";
import axiosInstance from "../utils/axios-instance";

export async function fetchRooms({ page = 1, pageSize = 5, sortColumn = 'Id', orderByDesc = false,
    keyword, idToken
}: Partial<{
    keyword: string
} & QueryPagedRequest> & {
    idToken: string
}) {

    let url = `/rooms?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (keyword) {
        url += `&keyword=${keyword}`;
    }

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchCreateRoom({
    idToken,
    ...data
}: {
    idToken: string,
} & CreateRoomRequest) {

    const response = await axiosInstance.post('/rooms', { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;

}

export async function fetchUpdateRoom({
    idToken,
    ...data
}: {
    idToken: string,
} & UpdateRoomRequest) {

    const response = await axiosInstance.put(`/rooms/${data.id}`, { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;

}

export async function fetchDeleteRoom({
    idToken,
    id
}: {
    idToken: string,
    id: string
}) {

    const response = await axiosInstance.delete(`/rooms/${id}`, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;

}