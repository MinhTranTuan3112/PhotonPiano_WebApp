import { EntranceTestResult } from "./entrance-test-result"

export type EntranceTestStudent = {
    id: string
    studentFirebaseId: string,
    entranceTestId: string,
    fullName?: string;
    bandScore?: number,
    rank?: number;
    instructorComment?: string;
}
export type EntranceTestStudentWithResults = {
    entranceTestResults: EntranceTestResult[];
} & EntranceTestStudent;