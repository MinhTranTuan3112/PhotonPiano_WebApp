
export type Account = {
    accountFirebaseId: string;
    username: string;
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

} & Omit<Account, 'level' | 'status' | 'avatarUrl' | 'address' | 'username'>;

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
        username: "Thanh Hưng",
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
        username: "Hiểu Phàm",
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
        username: "Nguyễn Ân",
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
        username: "Uyên Dương",
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
        username: "Hoàng Thái",
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
        username: "Ngân Trần",
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
        username: "Vũ Miên Ly",
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