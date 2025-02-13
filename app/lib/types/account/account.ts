export type Account = {
    accountFirebaseId: string;
    userName: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    shortDescription?: string;
    avatarUrl?: string;
    level?: number;
    status: number;
    desiredLevel?: string;
    desiredTargets: string[];
    favoriteMusicGenres: string[];
    preferredLearningMethods: string[];
    studentStatus?: StudentStatus;
};

export type SignUpRequest = {

} & Omit<Account, 'level' | 'status' | 'avatarUrl' | 'address' | 'username' | 'accountFirebaseId'>;

export enum Level {
    Beginner,
    Novice,
    Intermediate,
    Advanced,
    Virtuoso
}

export enum Role {
    Guest,
    Student,
    Instructor,
    Administrator,
    Staff
}

export enum StudentStatus {
    Unregistered,
    AttemptingEntranceTest,
    WaitingForClass,
    InClass,
    DropOut,
    Leave
}

export const sampleStudents: Account[] = [
    {
        accountFirebaseId: "1",
        userName: "Thanh Hưng",
        fullName: "Thanh Hưng",
        email: "thanhhung16082003@gmail.com",
        address: "Đồng Nai",
        phone: "0987654321",
        status: 3,
        level: 2,
        desiredTargets: [],
        favoriteMusicGenres: [],
        preferredLearningMethods: []
    },
    {
        accountFirebaseId: "2",
        userName: "Hiểu Phàm",
        fullName: "Hiểu Phàm",
        email: "hieuga47@yahoo.com",
        address: "Đồng Nai",
        phone: "0987654321",
        status: 2,
        level: 0,
        desiredTargets: [],
        favoriteMusicGenres: [],
        preferredLearningMethods: []
    },
    {
        accountFirebaseId: "3",
        userName: "Nguyễn Ân",
        fullName: "Nguyễn Ân",
        email: "nguynan001@gmail.com",
        address: "Đồng Nai",
        phone: "0987654321",
        status: 2,
        desiredTargets: [],
        favoriteMusicGenres: [],
        preferredLearningMethods: []
    },
    {
        accountFirebaseId: "4",
        userName: "Uyên Dương",
        fullName: "Uyên Dương",
        email: "ud@gmail.com",
        address: "Quảng Nam",
        phone: "0987654321",
        status: 1,
        desiredTargets: [],
        favoriteMusicGenres: [],
        preferredLearningMethods: []
    },
    {
        accountFirebaseId: "5",
        userName: "Hoàng Thái",
        fullName: "Hoàng Thái",
        email: "hthai0703@gmail.com",
        address: "Đồng Nai",
        phone: "0987654321",
        status: 0,
        desiredTargets: [],
        favoriteMusicGenres: [],
        preferredLearningMethods: []
    },
    {
        accountFirebaseId: "6",
        userName: "Ngân Trần",
        fullName: "Ngân Trần",
        email: "ngantran@gmail.com",
        address: "Đồng Nai",
        phone: "0987654321",
        status: 4,
        level: 3,
        desiredTargets: [],
        favoriteMusicGenres: [],
        preferredLearningMethods: []
    },
    {
        accountFirebaseId: "7",
        userName: "Vũ Miên Ly",
        fullName: "Vũ Miên Ly",
        email: "thanhngan@gmail.com",
        address: "Đồng Nai",
        phone: "0987654321",
        status: 5,
        level: 4,
        desiredTargets: [],
        favoriteMusicGenres: [],
        preferredLearningMethods: []
    }
]