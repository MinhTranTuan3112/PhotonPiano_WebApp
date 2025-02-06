import { Account } from "../account/account"
import { EntranceTestResult } from "./entrance-test-result"

export type EntranceTestStudent = {
    id: string
    studentId: string,
    entranceTestId: string,
    fullName?: string;
    bandScore?: number,
    rank?: number,
    instructorComment?: string,
}
export type EntranceTestStudentWithScore = {
    student: Account,
    entranceTestResults: EntranceTestResult[]
} & EntranceTestStudent