import axios from "axios";

const PINATA_UPLOAD_BASE_URL = 'https://uploads.pinata.cloud/v3';


const getPinataJwt = () => {
    const jwt = process.env.VITE_PINATA_JWT || process.env.PINATA_JWT;
    if (!jwt) {
        console.error("Pinata JWT is missing");
        throw new Error("Pinata JWT is not configured");
    }
    return jwt;
};

export async function uploadImageFile({
    file, name, groupId, size
}: {
    file: File,
    groupId: string,

} & Pick<File, "name" | "size">) {

    const formData = new FormData();

    formData.append("file", file);
    formData.append("name", name);
    formData.append("group_id", groupId);
    // formData.append("keyvalues", JSON.stringify({ size }));
    

    const response = await axios.post(`${PINATA_UPLOAD_BASE_URL}/files`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${getPinataJwt()}`,
        },
        timeout: 30000,
    });

    return response;
}

export async function deleteImageFile(fileId: string) {

    const response = await axios.delete(`https://api.pinata.cloud/v3/files/${fileId}`, {
        headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
        }
    });

    return response;
}

export async function getSignedImageUrl(fileId: string) {

    const payload = JSON.stringify({
        url: `${import.meta.env.VITE_PINATA_GATEWAY_BASE_URL}/${fileId}`,

        method: "GET",
    })

    const response = await axios.post(
        `https://api.pinata.cloud/v3/files/sign`,
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
            },
            body: payload
        });

    return await response.data;
}

export function getImageUrl(fileId: string) {
    return `${import.meta.env.VITE_PINATA_GATEWAY_BASE_URL}/${fileId}`;
}

export async function createImageGroup({
    name,
    isPublic = true
}: {
    name: string;
    isPublic?: boolean
}) {

    const response = await axios.post('https://api.pinata.cloud/v3/files/groups', {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
        },
        body: {
            name: name,
            is_public: isPublic
        }
    });

    return response;
}