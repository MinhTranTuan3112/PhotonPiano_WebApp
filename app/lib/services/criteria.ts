import { CriteriaFor } from "../types/criteria/criteria";
import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";

export async function fetchCriterias({
    page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    idToken
}: {
    idToken: string
} & Partial<QueryPagedRequest>) {

    let url = `/criterias?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchAllMinimalCriterias({
    criteriaFor = CriteriaFor.EntranceTest,
    idToken
}: {
    criteriaFor?: CriteriaFor,
    idToken: string
}) {
    let url = `/criterias/all-minimal?for=${criteriaFor}`;

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchCreateCriteria({ name, weight, description, criteriaFor, idToken }: {
    name : string,
    weight : number,
    description? : string,
    criteriaFor : CriteriaFor,
    idToken : string
}) {
    const response = await axiosInstance.post(`/criterias`, {
        name,
        weight,
        description,
        for : criteriaFor,
        idToken : idToken
    },{
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })
    return response;
}

export async function fetchUpdateCriteria({updateCriteria, criteriaFor, idToken }: {
    updateCriteria : {
        id : string
        name? : string,
        weight? : number,
        description? : string,
    }[],
    criteriaFor : CriteriaFor,
    idToken : string
}) {
    const response = await axiosInstance.put(`/criterias`, {
        updateCriteria,
        for : criteriaFor
    },{
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })
    return response;
}

export async function fetchDeleteCriteria({ id, idToken }: {
    id : string,
    idToken : string
}) {
    const response = await axiosInstance.delete(`/criterias/${id}`,{
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    })
    return response;
}