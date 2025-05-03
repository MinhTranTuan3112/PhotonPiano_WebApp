import axiosInstance from "../utils/axios-instance";

export async function fetchLevels() {
  const response = await axiosInstance.get("/levels");

  return response;
}

export async function fetchALevel({
  idToken,
  id,
}: {
  id: string;
  idToken: string;
}) {
  const response = await axiosInstance.get(`/levels/${id}`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  return response;
}

export async function fetchUpdateLevelMinimumGpa({
  idToken,
  levelId,
  minimumGpa,
}: {
  idToken: string;
  levelId: string;
  minimumGpa: number;
}) {
  const response = await axiosInstance.patch(
    `/levels/${levelId}/minimum-gpa`,
    { minimumGpa },
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}
