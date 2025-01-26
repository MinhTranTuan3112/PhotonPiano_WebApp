
export type Account = {
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
};

export type SignUpRequest = {

} & Omit<Account, 'level' | 'status' | 'avatarUrl' | 'address' | 'username'>;


export const sampleStudents : Account[] = [
    {
        username : "Thanh Hưng",
        email : "thanhhung16082003@gmail.com",
        address : "Đồng Nai",
        phone : "0987654321",
        status : 3,
        level : 2,
        desiredTargets : [],
        favoriteMusicGenres : [],
        preferredLearningMethods : []
    },
    {
        username : "Hiểu Phàm",
        email : "hieuga47@yahoo.com",
        address : "Đồng Nai",
        phone : "0987654321",
        status : 2,
        level : 1,
        desiredTargets : [],
        favoriteMusicGenres : [],
        preferredLearningMethods : []
    },
    {
        username : "Nguyễn Ân",
        email : "nguynan001@gmail.com",
        address : "Đồng Nai",
        phone : "0987654321",
        status : 2,
        desiredTargets : [],
        favoriteMusicGenres : [],
        preferredLearningMethods : []
    },
    {
        username : "Uyên Dương",
        email : "ud@gmail.com",
        address : "Quảng Nam",
        phone : "0987654321",
        status : 1,
        desiredTargets : [],
        favoriteMusicGenres : [],
        preferredLearningMethods : []
    },
    {
        username : "Hoàng Thái",
        email : "hthai0703@gmail.com",
        address : "Đồng Nai",
        phone : "0987654321",
        status : 0,
        desiredTargets : [],
        favoriteMusicGenres : [],
        preferredLearningMethods : []
    },
    {
        username : "Ngân Trần",
        email : "ngantran@gmail.com",
        address : "Đồng Nai",
        phone : "0987654321",
        status : 4,
        level : 3,
        desiredTargets : [],
        favoriteMusicGenres : [],
        preferredLearningMethods : []
    },
    {
        username : "Vũ Miên Ly",
        email : "thanhngan@gmail.com",
        address : "Đồng Nai",
        phone : "0987654321",
        status : 5,
        level : 4,
        desiredTargets : [],
        favoriteMusicGenres : [],
        preferredLearningMethods : []
    }
]