import { QueryPagedRequest } from "../types/query/query-paged-request";
import { PaymentMethod, PaymentStatus } from "../types/transaction/transaction";
import axiosInstance from "../utils/axios-instance";

export async function fetchTransactions({
    page = 1, pageSize = 10, sortColumn = 'Id', orderByDesc = true,
    statuses = [], methods = [],
    code, startDate, endDate,
    idToken
}:
    Partial<QueryPagedRequest & {
        statuses: PaymentStatus[];
        methods: PaymentMethod[];
        startDate: string;
        endDate: string;
        code: string
    }> & {
        idToken: string
    }
) {

    let url = `/transactions?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (code) {
        url += `&code=${code}`;
    }

    if (statuses.length > 0) {
        statuses.forEach((status) => {
            url += `&statuses=${status}`;
        })
    }

    if (methods.length > 0) {
        methods.forEach((method) => {
            url += `&methods=${method}`;
        });
    }

    if (startDate) {
        url += `&start-date=${startDate}`;
    }

    if (endDate) {
        url += `&end-date=${endDate}`;
    }

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}