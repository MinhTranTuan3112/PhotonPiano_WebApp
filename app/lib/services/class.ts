import { Level } from "../types/account/account";
import { QueryPagedRequest } from "../types/query/query-paged-request";
import axiosInstance from "../utils/axios-instance";
import { getErrorDetailsInfo } from "../utils/error";

export async function fetchClasses({
  page = 1,
  pageSize = 10,
  sortColumn = "Id",
  orderByDesc = true,
  keyword,
  levels = [],
  statuses = [],
  isPublic,
  idToken,
  forClassChanging,
}: Partial<
  QueryPagedRequest & {
    levels: string[];
    statuses: number[];
    isPublic?: boolean;
    idToken: string;
    keyword?: string;
    forClassChanging?: boolean;
  }
>) {
  let url = `/classes?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

  if (levels.length > 0) {
    levels.forEach((level) => {
      url += `&levels=${level}`;
    });
  }

  if (statuses.length > 0) {
    statuses.forEach((status) => {
      url += `&statuses=${status}`;
    });
  }

  if (isPublic) {
    url += `&is-public=${isPublic}`;
  }

  if (forClassChanging) {
    url += `&for-class-changing=${forClassChanging}`;
  }

  if (keyword) {
    url += `&keyword=${keyword}`;
  }

  const response = await axiosInstance.get(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  return response;
}

export async function fetchClassDetail(id: string, idToken: string) {
  let url = `/classes/${id}`;

  const response = await axiosInstance.get(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  return response;
}

export async function fetchClassScoreboard(id: string, idToken: string) {
  let url = `/classes/${id}/scoreboard`;

  const response = await axiosInstance.get(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  return response;
}

export async function fetchAddStudentsToClass({
  studentFirebaseIds,
  classId,
  isAutoFill = false,
  idToken,
}: {
  studentFirebaseIds: string[];
  classId: string;
  isAutoFill?: boolean;
  idToken: string;
}) {
  const response = await axiosInstance.post(
    `/classes/student-class`,
    {
      classId: classId,
      isAutoFill: isAutoFill,
      studentFirebaseIds: studentFirebaseIds,
    },
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}

export async function fetchDeleteStudentClass({
  studentId,
  classId,
  isExpelled = false,
  idToken,
}: {
  studentId: string;
  classId: string;
  isExpelled?: boolean;
  idToken: string;
}) {
  const response = await axiosInstance.delete(
    `/classes/student-class?studentId=${studentId}&classId=${classId}&isExpelled=${isExpelled}`,
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}

export async function fetchCreateClass({
  level,
  idToken,
}: {
  level: string;
  idToken: string;
}) {
  const response = await axiosInstance.post(
    `/classes/`,
    {
      levelId: level,
    },
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}
export async function fetchUpdateClass({
  id,
  level,
  name,
  instructorId,
  scheduleDescription,
  idToken,
}: {
  id: string;
  name?: string;
  instructorId?: string;
  scheduleDescription?: string;
  level?: string;
  idToken: string;
}) {
  const response = await axiosInstance.put(
    `/classes/`,
    {
      levelId: level,
      id: id,
      name: name,
      instructorId: instructorId,
      scheduleDescription: scheduleDescription,
    },
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}
export async function fetchDeleteClass({
  id,
  idToken,
}: {
  id: string;
  idToken: string;
}) {
  const response = await axiosInstance.delete(`/classes/${id}`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  return response;
}
export async function fetchSchduleAClass({
  id,
  startWeek,
  shift,
  dayOfWeeks,
  idToken,
}: {
  id: string;
  startWeek: string;
  dayOfWeeks: number[];
  shift: number;
  idToken: string;
}) {
  const response = await axiosInstance.patch(
    `/classes/scheduling`,
    {
      startWeek: startWeek,
      id: id,
      shift: shift,
      dayOfWeeks: dayOfWeeks,
    },
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}

export async function fetchAutoArrange({
  studentNumber,
  shifts,
  startWeek,
  idToken,
}: {
  startWeek: string;
  studentNumber?: number;
  shifts: number[];
  idToken: string;
}) {
  const response = await axiosInstance.post(
    `/classes/auto-arrangement`,
    {
      startWeek: startWeek,
      studentNumber: studentNumber,
      allowedShifts: shifts,
    },
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}

export async function importStudentClassScoresFromExcel({
  classId,
  excelFile,
  idToken,
}: {
  classId: string;
  excelFile: File;
  idToken: string;
}) {
  const url = `/classes/${classId}/student-scores`;

  const formData = new FormData();
  formData.append("file", excelFile);
  const response = await axiosInstance.post(url, formData, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));
  return response;
}

export async function fetchStudentClasses({
  idToken,
  accountId,
  page = 1,
  pageSize = 10,
  sortColumn = "Id",
  orderByDesc = true,
}: {
  idToken: string;
  accountId: string;
  page?: number;
  pageSize?: number;
  sortColumn?: string;
  orderByDesc?: boolean;
}) {
  if (!idToken) {
    throw new Error("Authentication token is required");
  }

  const url = `/classes?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}&student-id=${accountId}`;

  const response = await axiosInstance.get(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  return response;
}
export async function fetchClearScheduleClass({
  id,
  idToken,
}: {
  id: string;
  idToken: string;
}) {
  const response = await axiosInstance.delete(`/classes/${id}/schedule`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  return response;
}
export async function fetchPublishAClass({
  id,
  idToken,
}: {
  id: string;
  idToken: string;
}) {
  const response = await axiosInstance.patch(
    `/classes/${id}/publishing`,
    {},
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}

export async function fetchChangeAClass({
  oldClassId,
  newClassId,
  studentId,
  idToken,
}: {
  oldClassId: string;
  newClassId: string;
  studentId: string;
  idToken: string;
}) {
  const response = await axiosInstance.put(
    `/classes/student-class`,
    {
      oldClassId: oldClassId,
      newClassId: newClassId,
      studentFirebaseId: studentId,
    },
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}

export interface TeacherClassQueryParams extends Partial<QueryPagedRequest> {
  keyword?: string;
  idToken: string;
  accountId: string;
}

export interface ClassDetailsResponse {
  id: string;
  idToken: string;
}

export interface GradeTemplateResponse {
  id: string;
  idToken: string;
}

export async function fetchTeacherClasses({
  page = 1,
  pageSize = 5,
  sortColumn = "Id",
  orderByDesc = false,
  keyword,
  idToken,
  accountId,
}: TeacherClassQueryParams) {
  if (!idToken) {
    throw new Error("Authentication token is required");
  }

  let url = `/classes?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}&teacher-id=${accountId}`;
  if (keyword) {
    url += `&keyword=${keyword}`;
  }

  const response = await axiosInstance.get(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response;
}

export async function fetchClassDetails({ id, idToken }: ClassDetailsResponse) {
  if (!idToken) {
    throw new Error("Authentication token is required");
  }
  let url = `/classes/${id}`;
  const response = await axiosInstance.get(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  return response;
}

export async function fetchGradeTemplate({
  id,
  idToken,
}: GradeTemplateResponse) {
  if (!idToken) {
    throw new Error("Authentication token is required");
  }
  let url = `/classes/${id}/grade-template`;
  const response = await axiosInstance.get(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    responseType: "blob",
  });
  return response;
}

export async function publishStudentClassScore({
  classId,
  idToken,
}: {
  classId: string;
  idToken: string;
}) {
  const response = await axiosInstance.post(
    `/classes/${classId}/score-publishing-status`,
    {},
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}

export async function fetchStudentScoreDetails({
  classId,
  studentId,
  idToken,
}: {
  classId: string;
  studentId: string;
  idToken: string;
}) {
  // Updated URL and parameters to match your API endpoint
  const response = await axiosInstance.get(
    `/classes/${classId}/students/${studentId}/detailed-scores`,
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}

export async function fetchUpdateLearningStatus({
  idToken,
  continueLearning,
}: {
  idToken: string;
  continueLearning: boolean;
}) {
  const response = await axiosInstance.put(
    `/accounts/continuation-status`,
    {
      wantToContinue: continueLearning,
    },
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}
export async function fetchDelayAClass({
  classId,
  weeks,
  idToken,
}: {
  classId: string;
  weeks: number;
  idToken: string;
}) {
  const response = await axiosInstance.put(
    `/classes/schedule-shifting`,
    {
      classId,
      weeks,
    },
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}

export async function fetchMergeAClass({
  sourceClassId,
  destClassId,
  idToken,
}: {
  sourceClassId: string;
  destClassId: string;
  idToken: string;
}) {
  const response = await axiosInstance.put(
    `/classes/merging`,
    {
      sourceClassId,
      targetClassId: destClassId,
    },
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  return response;
}

export async function fetchMergableClasses({
  classId,
  idToken,
}: {
  classId: string;
  idToken: string;
}) {
  const response = await axiosInstance.get(`/classes/${classId}/merging`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  return response;
}
