import { Account, Level, Role } from "../account/account"

export type Class = {
    id : string,
    name : string,
    totalSlots : number,
    requiredSlots : number,
    capacity : number,
    instructor? : Account,
    studentNumber : number,
    level : Level,
    levelId: string,
    status : number,
    isPublic : boolean,
    minimumStudents : number,
    startDate? : string
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
    role : Role.Instructor
}
