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

  const url = `/student-class/${classId}/scores`;

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

  const url = "/student-class/batch-update-scores";

  try {
    const response = await axiosInstance.put(
      url,
      {
        classId: classId,
        scores: scoresData.scores,
        request: {}, // Add empty request object to satisfy API validation
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
