import axiosInstance from "../utils/axios-instance";

export async function fetchStudentClassScores({
  classId,
  idToken,
}: {
  classId: string;
  idToken: string;
}) {
  if (!idToken) {
    throw new Error("Authentication token is required");
  }

  const url = `/classes/${classId}/student-scores`;
  try {
    const response = await axiosInstance.get(url, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    return response;
  } catch (error) {
    console.error("Error fetching student scores:", error);
    throw error;
  }
}

export async function batchUpdateStudentScores({
  classId,
  scoresData,
  idToken,
}: {
  classId: string;
  scoresData: {
    scores: Array<{
      studentClassId: string;
      criteriaId: string;
      score: number;
    }>;
  };
  idToken: string;
}) {
  if (!idToken) {
    throw new Error("Authentication token is required");
  }

  const url = `/classes/${classId}/student-scores`;

  try {
    const response = await axiosInstance.put(
      url,
      {
        classId: classId,
        scores: scoresData.scores,
        request: {},
      },
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error updating student scores:", error);
    throw error;
  }
}

export async function rollBackScorePublishing({
  classId,
  idToken,
}: {
  classId: string;
  idToken: string;
}) {
  if (!idToken) {
    throw new Error("Authentication token is required");
  }

  const url = `/classes/${classId}/scores/rollback-publish`;
  try {
    const response = await axiosInstance.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error rolling back published scores:", error);
    throw error;
  }
}
