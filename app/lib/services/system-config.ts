import axiosInstance from "../utils/axios-instance";

export async function fetchSystemConfigs({ idToken } : {idToken : string}){

    const response = await axiosInstance.get("/system-configs", {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });
    
    return response;
}

export async function fetchSystemConfigByName({ name, idToken } : {name : string, idToken : string}){

    const response = await axiosInstance.get("/system-configs/" + name, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });
    
    return response;
}