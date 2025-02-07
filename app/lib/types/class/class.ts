import { Account } from "../account/account"

export type Class = {
    id : string,
    name : string,
    totalSlots : number,
    requiredSlots : number,
    capacity : number,
    instructor? : Account,
    studentNumber : number,
    level : number,
    status : number
}
const teacher = {
    accountFirebaseId : "abc",
    userName : "Thanh Hung",
    fullName : "Thanh Hung",
    favoriteMusicGenres : [],
    desiredTargets : [],
    preferredLearningMethods : [],
    address : "",
    email : "thanhhung@gmail.com",
    status : 0,
    phone : "0987654321",
}
export const sampleClasses : Class[] = [
    {
        name : "LEVEL1_1_012025",
        level : 0,
        totalSlots : 20,
        instructor : teacher,
        id : "a",
        studentNumber : 10,
        status : 0,
        capacity : 12,
        requiredSlots : 20
    },
    {
        name : "LEVEL2_1_012025",
        level : 1,
        totalSlots : 20,
        instructor : teacher,
        id : "b",
        studentNumber : 8,
        status : 1,
        capacity : 12,
        requiredSlots : 20
    },
    {
        name : "LEVEL3_1_012025",
        level : 2,
        totalSlots : 30,
        instructor : teacher,
        id : "c",
        studentNumber : 9,
        status : 2,
        capacity : 12,
        requiredSlots : 30
    },
    {
        name : "LEVEL4_1_012025",
        level : 3,
        totalSlots : 40,
        id : "d",
        studentNumber : 10,
        status : 0,
        capacity : 12,
        requiredSlots : 40
    },
    {
        name : "LEVEL5_1_012025",
        level : 4,
        totalSlots : 48,
        id : "e",
        studentNumber : 10,
        status : 0,
        capacity : 12,
        requiredSlots : 50
    }
]