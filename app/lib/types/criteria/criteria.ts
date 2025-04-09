export type Criteria = {
    id : string,
    name : string,
    weight : number,
    description : string,
    for: CriteriaFor;
}

export type MinimalCriteria = Pick<Criteria, "id" | "name" | "weight">;

export enum CriteriaFor {
  EntranceTest,
  Class,
}

export type StudentScore = {
  studentId: string;
  studentName: string;
  gpa: number;
  isPassed: boolean;
  instructorComment: string | null;
  certificateUrl: string | null;
  criteriaScores: Array<{
    criteriaId: string;
    criteriaName: string;
    weight: number;
    score: number;
  }>;
};

export type ScoreDetailsDialogProps = {
  studentName?: string;
  gpa?: number;
  criteriaScores?: Array<{
    criteriaId: string;
    criteriaName: string;
    weight: number;
    score: number;
  }>;
  // New props for class-level data
  classData?: {
    studentClasses: any;
    classId: string;
    className: string;
    levelName: string;
    isScorePublished: boolean;
    students: StudentScore[];
  };
  idToken?: string;
  isClassView?: boolean;
  onScoresUpdated?: (updatedScores: StudentScore[]) => void;
};
