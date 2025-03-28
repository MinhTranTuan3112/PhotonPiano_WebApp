import { Account, Level, Role } from "../account/account";
import { StudentClass } from "./student-class";

export type Class = {
  id: string;
  name: string;
  totalSlots: number;
  requiredSlots: number;
  capacity: number;
  instructor?: Account;
  studentNumber: number;
  level: Level;
  status: number;
  isPublic: boolean;
  minimumStudents: number;
  startDate?: string;
};
const teacher = {
  accountFirebaseId: "abc",
  userName: "Thanh Hung",
  fullName: "Thanh Hung",
  favoriteMusicGenres: [],
  desiredTargets: [],
  preferredLearningMethods: [],
  address: "",
  email: "thanhhung@gmail.com",
  status: 0,
  phone: "0987654321",
  role: Role.Instructor,
};

// ClassDetails type
export type ClassDetails = {
  pricePerSlots: number;
  slotsPerWeek: number;
  studentClasses: StudentClass[];
  slots: ClassSlot[];
  id: string;
  instructorId: string;
  instructorName: string | null;
  status: number;
  startTime: string;
  levelId: string;
  isPublic: boolean;
  name: string;
  createdById: string;
  isScorePublished: boolean;
  capacity: number;
  minimumStudents: number;
  requiredSlots: number;
  totalSlots: number;
  studentNumber: number;
  updateById: string;
  deletedById: string | null;
  createdAt: string;
  updatedAt: string;
  instructor: Account;
  level: Level;
  idToken?: string;
};

// ClassSlot type
export type ClassSlot = {
  id: string;
  classId: string;
  roomId: string;
  shift: number;
  date: string;
  status: number;
};
