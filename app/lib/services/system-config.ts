import { SurveyConfigFormData } from "~/components/settings/survey-config-form";
import axiosInstance from "../utils/axios-instance";
import { EntranceTestSettingsFormData } from "~/components/settings/entrance-test-form";

export async function fetchSystemConfigs({ idToken }: { idToken: string }) {

    const response = await axiosInstance.get("/system-configs", {
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