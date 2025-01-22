
export type Account = {
    username: string;
    email: string;
    phone: string;
    address: string;
    avatarUrl? : string;
    status : number;
    level? : number;
    
};

export const sampleStudents : Account[] = [
    {
        username : "Thanh Hưng",
        email : "thanhhung16082003@gmail.com",
        address : "Đồng Nai",
        phone : "0987654321",
        status : 3,
        level : 2
    },
    {
        username : "Hiểu Phàm",
        email : "hieuga47@yahoo.com",
        address : "Đồng Nai",
        phone : "0987654321",
        status : 2,
        level : 1
    },
    {
        username : "Nguyễn Ân",
        email : "nguynan001@gmail.com",
        address : "Đồng Nai",
        phone : "0987654321",
        status : 2,
    },
    {
        username : "Uyên Dương",
        email : "ud@gmail.com",
        address : "Quảng Nam",
        phone : "0987654321",
        status : 1,
    },
    {
        username : "Hoàng Thái",
        email : "hthai0703@gmail.com",
        address : "Đồng Nai",
        phone : "0987654321",
        status : 0,
    },
    {
        username : "Ngân Trần",
        email : "ngantran@gmail.com",
        address : "Đồng Nai",
        phone : "0987654321",
        status : 4,
        level : 3
    },
    {
        username : "Vũ Miên Ly",
        email : "thanhngan@gmail.com",
        address : "Đồng Nai",
        phone : "0987654321",
        status : 5,
        level : 4
    }
]