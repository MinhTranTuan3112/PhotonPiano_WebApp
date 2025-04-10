import axiosInstance from "../utils/axios-instance";
import { getErrorDetailsInfo } from "../utils/error";

export async function fetchStudentCertificates({
  idToken,
}: {
  idToken: string;
}) {
  if (!idToken) {
    throw new Error("Authentication token is required");
  }
  let url = `/certificates/my-certificates`;
  const response = await axiosInstance.get(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response;
}

export async function fetchCertificate({
  studentClassId,
  idToken,
}: {
  studentClassId: string;
  idToken: string;
}) {
  if (!idToken) {
    throw new Error("Authentication token is required");
  }

  try {
    const response = await axiosInstance.get(
      `/certificates/student/${studentClassId}`,
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    return response;
  } catch (error) {
    console.error(`Error fetching certificate ${studentClassId}:`, error);
    throw new Error(getErrorDetailsInfo(error).message);
  }
}
