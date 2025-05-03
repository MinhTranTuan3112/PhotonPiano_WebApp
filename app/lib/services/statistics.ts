import axiosInstance from "../utils/axios-instance";

export async function fetchOverviewStatistics({
    idToken, month, year
}: {
    idToken: string;
    month?: number;
    year?: number;
}) {

    const response = await axiosInstance.get(`/stats/overview-stats`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        }
    });

    return response;
}

export async function fetchMonthlyRevenueStats({
    idToken, year
}: {
    idToken: string;
    year: number;
}) {

    const response = await axiosInstance.get(`/stats/revenue-stats`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
        params: {
            year
        },
    });

    return response;
}

export async function fetchLevelsStats({
    idToken, filterBy = "classes"
}: {
    filterBy?: string;
    idToken: string;
}) {

    const response = await axiosInstance.get(`/stats/level-stats`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
        params: {
            filterBy
        }
    });

    return response;
}