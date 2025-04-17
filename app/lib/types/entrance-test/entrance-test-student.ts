import { Account, Level } from "../account/account";
import { Criteria } from "../criteria/criteria";
import { EntranceTest } from "./entrance-test";
import { EntranceTestResult, EntranceTestResultWithCriteria } from "./entrance-test-result"

export type EntranceTestStudent = {
    id: string;
    studentFirebaseId: string;
    entranceTestId: string;
    fullName?: string;
    bandScore?: number;
    levelId?: string;
    level?: Level;
    theoraticalScore?: number;
    instructorComment?: string;
    student : Account;
}

export type EntranceTestStudentWithResults = {
    entranceTestResults: EntranceTestResultWithCriteria[];
} & EntranceTestStudent;

export type EntranceTestStudentDetail = {
    entranceTest: EntranceTest;
    student: EntranceTestStudent;
    entranceTestResults: EntranceTestResult[];
} & EntranceTestStudent;