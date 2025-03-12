import { Level } from "../account/account";
import { Criteria } from "../criteria/criteria";
import { EntranceTestResult } from "./entrance-test-result"

export type EntranceTestStudent = {
    id: string
    studentFirebaseId: string,
    entranceTestId: string,
    fullName?: string;
    bandScore?: number,
    level?: Level;
    theoraticalScore?: number;
    instructorComment?: string;
}

export type EntranceTestStudentWithResults = {
    entranceTestResults: EntranceTestResult[];
} & EntranceTestStudent;