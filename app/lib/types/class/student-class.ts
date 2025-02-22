import { Account } from "../account/account"

export type StudentClass = {
    classId : string,
    studentFirebaseId : string,
    createdById : string,
    updatedById? : string,
    deletedById? : string,
    certificateUrl? : string,
    isPassed : boolean,
    instructorComment? : string
}

export type StudentClassWithStudent = {
    student : Account,
} & StudentClass