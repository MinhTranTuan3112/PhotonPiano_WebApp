import { Account } from "../account/account"
import { Class } from "./class"
import { StudentClassScoreWithCriteria } from "./student-class-score"

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

export type StudentClassWithClass = {
    class : Class,
} & StudentClass

export type StudentClassWithScore = {
    studentClassScores : StudentClassScoreWithCriteria[],
} & StudentClassWithStudent