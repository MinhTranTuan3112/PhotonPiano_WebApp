import { Class } from "../class/class";
import { StudentClassWithClass } from "../class/student-class";
import { EntranceTest } from "../entrance-test/entrance-test";
import { EntranceTestStudent, EntranceTestStudentDetail } from "../entrance-test/entrance-test-student";
import { FreeSlot } from "../free-slot/free-slot";
import { LearnerSurveyWithAnswers, LearnerSurveyWithAnswersDetail } from "../survey/survey";

export type Account = {
    accountFirebaseId: string;
    userName: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    gender?: Gender;
    dateOfBirth?: string;
    shortDescription?: string;
    avatarUrl?: string;
    level?: Level;
    levelId?: string;
    status: number;
    desiredLevel?: string;
    desiredTargets: string[];
    favoriteMusicGenres: string[];
    preferredLearningMethods: string[];
    studentStatus?: StudentStatus;
    role: Role;
    wantToContinue?: boolean;
};

export type AccountDetail = {
    currentClass? : Class
    studentClasses : StudentClassWithClass[],
    learnerSurveys : LearnerSurveyWithAnswersDetail[],
    entranceTestStudents : EntranceTestStudentDetail[],
    freeSlots : FreeSlot[]
} & Account

export type TeacherDetail = {
    instructorEntranceTests : EntranceTest[],
    instructorClasses : Class[]
} & Account

export type AwaitingLevelCount = {
    level? : Level,
    count : number
}

export type SignUpRequest = {

} & Omit<Account, 'level' | 'status' | 'avatarUrl' | 'address' | 'username' | 'accountFirebaseId'>;

export type UpdateAccountRequest = {

} & Partial<Pick<Account, 'userName' | 'fullName' | 'phone' | 'address'
    | 'avatarUrl' | 'dateOfBirth' | 'gender' | 'shortDescription'>>;

export enum Gender {
    Male,
    Female
}

export type Level = {
   id: string;
   name: string;
   description: string;
   skillsEarned: string[];
   slotPerWeek: number;
   totalSlots: number;
   pricePerSlot: number;
   minimumScore: number;
   isGenreDivided: boolean;
   nextLevelId?: string;
   themeColor? : string;
}

export type LevelDetails = {
    accounts: Account[];
    classes: Class[];
} & Level;

export const sampleLevels: Level[] = [
    {
        id: "1",
        name: "Beginner",
        description: "For those who have never played the piano before.",
        skillsEarned: ["Basic knowledge of piano", "Basic knowledge of music theory"],
        slotPerWeek: 1,
        totalSlots: 10,
        pricePerSlot: 100000,
        minimumScore: 0,
        isGenreDivided: false,
        nextLevelId: "2"
    },
    {
        id: "2",
        name: "Novice",
        description: "For those who have played the piano for a few months.",
        skillsEarned: ["Intermediate knowledge of piano", "Intermediate knowledge of music theory"],
        slotPerWeek: 1,
        totalSlots: 10,
        pricePerSlot: 100000,
        minimumScore: 100,
        isGenreDivided: false,
        nextLevelId: "3"
    },
    {
        id: "3",
        name: "Intermediate",
        description: "For those who have played the piano for a few years.",
        skillsEarned: ["Advanced knowledge of piano", "Advanced knowledge of music theory"],
        slotPerWeek: 1,
        totalSlots: 10,
        pricePerSlot: 100000,
        minimumScore: 200,
        isGenreDivided: false,
        nextLevelId: "4"
    },
    {
        id: "4",
        name: "Advanced",
        description: "For those who have played the piano for many years.",
        skillsEarned: ["Virtuoso knowledge of piano", "Virtuoso knowledge of music theory"],
        slotPerWeek: 1,
        totalSlots: 10,
        pricePerSlot: 100000,
        minimumScore: 300,
        isGenreDivided: false,
        nextLevelId: "5"
    },
    {
        id: "5",
        name: "Virtuoso",
        description: "For those who have played the piano for many years.",
        skillsEarned: ["Virtuoso knowledge of piano", "Virtuoso knowledge of music theory"],
        slotPerWeek: 1,
        totalSlots: 10,
        pricePerSlot: 100000,
        minimumScore: 400,
        isGenreDivided: false
    }
]

// export enum Level {
//     Beginner,
//     Novice,
//     Intermediate,
//     Advanced,
//     Virtuoso
// }

export enum Role {
    Guest,
    Student,
    Instructor,
    Administrator,
    Staff
}

export enum StudentStatus {
    Unregistered,
    WaitingForEntranceTestArrangement,
    AttemptingEntranceTest,
    WaitingForClass,
    InClass,
    DropOut,
    Leave
}

// export const sampleStudents: Account[] = [
//     {
//         accountFirebaseId: "1",
//         userName: "Thanh Hưng",
//         fullName: "Thanh Hưng",
//         email: "thanhhung16082003@gmail.com",
//         address: "Đồng Nai",
//         phone: "0987654321",
//         status: 3,
//         level: 2,
//         desiredTargets: [],
//         favoriteMusicGenres: [],
//         preferredLearningMethods: [],
//         role: Role.Student
//     },
//     {
//         accountFirebaseId: "2",
//         userName: "Hiểu Phàm",
//         fullName: "Hiểu Phàm",
//         email: "hieuga47@yahoo.com",
//         address: "Đồng Nai",
//         phone: "0987654321",
//         status: 2,
//         level: 0,
//         desiredTargets: [],
//         favoriteMusicGenres: [],
//         preferredLearningMethods: [],
//         role: Role.Student
//     },
//     {
//         accountFirebaseId: "3",
//         userName: "Nguyễn Ân",
//         fullName: "Nguyễn Ân",
//         email: "nguynan001@gmail.com",
//         address: "Đồng Nai",
//         phone: "0987654321",
//         status: 2,
//         desiredTargets: [],
//         favoriteMusicGenres: [],
//         preferredLearningMethods: [],
//         role: Role.Student
//     },
//     {
//         accountFirebaseId: "4",
//         userName: "Uyên Dương",
//         fullName: "Uyên Dương",
//         email: "ud@gmail.com",
//         address: "Quảng Nam",
//         phone: "0987654321",
//         status: 1,
//         desiredTargets: [],
//         favoriteMusicGenres: [],
//         preferredLearningMethods: [],
//         role: Role.Student
//     },
//     {
//         accountFirebaseId: "5",
//         userName: "Hoàng Thái",
//         fullName: "Hoàng Thái",
//         email: "hthai0703@gmail.com",
//         address: "Đồng Nai",
//         phone: "0987654321",
//         status: 0,
//         desiredTargets: [],
//         favoriteMusicGenres: [],
//         preferredLearningMethods: [],
//         role: Role.Student
//     },
//     {
//         accountFirebaseId: "6",
//         userName: "Ngân Trần",
//         fullName: "Ngân Trần",
//         email: "ngantran@gmail.com",
//         address: "Đồng Nai",
//         phone: "0987654321",
//         status: 4,
//         level: 3,
//         desiredTargets: [],
//         favoriteMusicGenres: [],
//         preferredLearningMethods: [],
//         role: Role.Student
//     },
//     {
//         accountFirebaseId: "7",
//         userName: "Vũ Miên Ly",
//         fullName: "Vũ Miên Ly",
//         email: "thanhngan@gmail.com",
//         address: "Đồng Nai",
//         phone: "0987654321",
//         status: 5,
//         level: 4,
//         desiredTargets: [],
//         favoriteMusicGenres: [],
//         preferredLearningMethods: [],
//         role: Role.Student
//     }
// ]