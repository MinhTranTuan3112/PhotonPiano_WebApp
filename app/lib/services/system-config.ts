import { SurveyConfigFormData } from "~/components/settings/survey-config-form";
import axiosInstance from "../utils/axios-instance";
import { EntranceTestSettingsFormData } from "~/components/settings/entrance-test-form";
import {PAYMENT_DEADLINE_DAYS, PAYMENT_REMINDER_DAY, TAX_RATE_2025, TRIAL_SESSION_COUNT} from "../utils/config-name";
import {TuitionConfigFormData} from "~/components/settings/tuition-config-form";
import {SchedulerConfigFormData} from "~/components/settings/scheduler-config-form";
import { ClassSettingsFormData } from "~/components/settings/classes-config-form";

export async function fetchSystemConfigs({ idToken, names = [] }: { idToken: string, names?: string[] }) {

    let url = "/system-configs";

    if (names.length > 0) {
        names.forEach((name) => {
            url += `?names=${name}`;

            if (names[names.length - 1] !== name) {
                url += "&";
            }
        })
    }

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchSystemConfigByName({ name, idToken }: { name: string, idToken: string }) {

    const response = await axiosInstance.get("/system-configs/" + name, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchSystemConfigSlotCancel({ idToken }: { idToken: string }) {
    const response = await axiosInstance.get("/system-configs/cancel-slot-reason", {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchUpdateSurveySystemConfig({
    idToken,
    ...data
}: {
    idToken: string
} & Partial<SurveyConfigFormData>) {

    const response = await axiosInstance.put("/system-configs/survey", { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;

}

export async function fetchUpdateEntranceTestSystemConfig({
    idToken,
    ...data
}: {
    idToken: string
} & Partial<EntranceTestSettingsFormData>) {

    const response = await axiosInstance.put("/system-configs/entrance-test", { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchUpdateTuitionSystemConfig({
                                                         idToken,
                                                         taxRate2025,
                                                         paymentDeadlineDays,
                                                         trialSessionCount,
                                                     }: {
    idToken: string
} & Partial<TuitionConfigFormData>) {

    const requestData = {
        TaxRates: taxRate2025,
        DeadlineForPayTuition: paymentDeadlineDays,
        SlotTrial: trialSessionCount
    };

    const response = await axiosInstance.put("/system-configs/tuition", requestData, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchUpdateSchedulerSystemConfig({
                                                           idToken,
                                                           deadlineAttendance,
                                                           reasonCancelSlot
                                                       }: {
    idToken: string;
    deadlineAttendance?: number;
    reasonCancelSlot?: string[] | string | null;
}) {

    let parsedReasonCancelSlot = reasonCancelSlot;
    if (typeof reasonCancelSlot === 'string') {
        try {
            parsedReasonCancelSlot = JSON.parse(reasonCancelSlot);
        } catch (e) {
            console.error("Failed to parse reasonCancelSlot:", e);
            parsedReasonCancelSlot = [];
        }
    }

    const requestData = {
        DeadlineAttendance: deadlineAttendance,
        ReasonCancelSlot: parsedReasonCancelSlot
    };

    console.log("Sending to backend:", requestData);

    const response = await axiosInstance.put("/system-configs/schedule", requestData, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}


export async function fetchDeadlineSchedulerSystemConfig({
                                                             idToken
                                                         }: {
    idToken: string
} & Partial<EntranceTestSettingsFormData>) {

    // Using the specific endpoint for getting config by name
    const response = await axiosInstance.get("/system-configs/attendance-deadline", {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchRefundTuitionSystemConfig({
                                                             idToken
                                                         }: {
    idToken: string
}) {
    console.log("Fetching refund reasons with idToken:", idToken);

    try {
        // Using the specific endpoint for getting config by name
        const response = await axiosInstance.get("/system-configs/refund-reason", {
            headers: {
                Authorization: `Bearer ${idToken}`
            }
        });

        console.log("Refund API response:", response);

        return response;
    } catch (error) {
        console.error("Error fetching refund reasons from API:", error);
        throw error;
    }
}

export async function fetchUpdateClassSystemConfig({
    idToken,
    ...data
}: {
    idToken: string
} & Partial<ClassSettingsFormData>) {

    const response = await axiosInstance.put("/system-configs/classes", { ...data }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchUpdateRefundTuitionSystemConfig({
    idToken,
    reasonRefundTuition
}: {
    idToken: string;
    reasonRefundTuition?: string[] | string | null;
}) {

    let parsedReasonRefundTuition = reasonRefundTuition;
    if (typeof reasonRefundTuition === 'string') {
        try {
            parsedReasonRefundTuition = JSON.parse(reasonRefundTuition);
        } catch (e) {
            console.error("Failed to parse reasonRefundTuition:", e);
            parsedReasonRefundTuition = [];
        }
    }

    const requestData = {
        ReasonRefundTuition: parsedReasonRefundTuition
    };

    console.log("Sending to backend:", requestData);

    const response = await axiosInstance.put("/system-configs/refund", requestData, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}
