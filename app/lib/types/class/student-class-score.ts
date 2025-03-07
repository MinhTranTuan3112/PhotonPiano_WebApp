import { Criteria } from "../criteria/criteria"

export type StudentClassScore = {
    studentClassId : string,
    score? : number,
    criteriaId : string
}

export type StudentClassScoreWithCriteria = {
    criteria : Criteria
} & StudentClassScore