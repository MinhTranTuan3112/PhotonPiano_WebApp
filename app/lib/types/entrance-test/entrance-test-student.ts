import { Account, Level } from "../account/account";
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
    levelAdjustedAt?: string;
    theoraticalScore?: number;
    instructorComment?: string;
    isScoreAnnounced: boolean;
    student : Account;
    updatedAt?: string;
}

export type EntranceTestStudentWithResults = {
    entranceTestResults: EntranceTestResultWithCriteria[];
    level?: Level;
} & EntranceTestStudent;

export type EntranceTestStudentDetail = {
    entranceTest: EntranceTest;
    student: EntranceTestStudent;
    entranceTestResults: EntranceTestResult[];
} & EntranceTestStudent;