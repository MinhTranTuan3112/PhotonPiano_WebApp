import { Account } from "../account/account"
import { Tuition } from "../tuition/tuition";
import { Class } from "./class"
import { StudentClassScoreWithCriteria } from "./student-class-score"

export type StudentClass = {
  id: string;
  classId: string;
  studentFirebaseId: string;
  studentFullName: string;
  className: string;
  createdById: string;
  updateById: string | null;
  deletedById: string | null;
  certificateUrl: string | null;
  isPassed: boolean;
  gpa: number | null;
  instructorComment: string | null;
  student: Student;
};

export type StudentClassDetails = {
  class: Class;
  tutions: Tuition[];
} & StudentClass;

// Student type
export type Student = {
  accountFirebaseId: string;
  userName: string;
  phone: string;
  fullName: string;
  email: string;
  role: number;
  avatarUrl: string;
  dateOfBirth: string | null;
  address: string;
  gender: number | null;
  bankAccount: string;
  isEmailVerified: boolean;
  joinedDate: string;
  shortDescription: string;
  levelId: string | null;
  status: number;
  registrationDate: string | null;
  studentStatus: number;
  desiredLevel: string | null;
  desiredTargets: any[];
  favoriteMusicGenres: any[];
  preferredLearningMethods: any[];
  recordStatus: number;
  currentClassId: string;
  level: any | null;
};

export type StudentClassWithStudent = {
  student: Account,
} & StudentClass

export type StudentClassWithClass = {
  class: Class,
} & StudentClass

export type StudentClassWithScore = {
  studentClassScores: StudentClassScoreWithCriteria[];
} & StudentClassWithStudent;
