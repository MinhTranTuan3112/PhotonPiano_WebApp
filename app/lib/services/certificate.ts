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
  let url = `/classes/my-certificates`;
  const response = await axiosInstance.get(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response;
}

export async function fetchCertificate({
  classId,
  studentId,
  idToken,
}: {
  classId: string;
  studentId: string;
  idToken: string;
}) {
  if (!idToken) {
    throw new Error("Authentication token is required");
  }

  try {
    const response = await axiosInstance.get(
      `/classes/${classId}/students/${studentId}/certificate`,
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    return response;
  } catch (error) {
    console.error(
      `Error fetching certificate for student ${studentId} in class ${classId}:`,
      error
    );
    throw new Error(getErrorDetailsInfo(error).message);
  }
}
