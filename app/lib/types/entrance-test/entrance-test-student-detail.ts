
import { Account } from "../account/account"
import { EntranceTestDetail } from "./entrance-test-detail"
import { EntranceTestResult } from "./entrance-test-result"
import { EntranceTestStudent } from "./entrance-test-student"

export type EntranceTestStudentDetail = {
    student : Account,
    entranceTest : EntranceTestDetail,
    entranceTestResults : EntranceTestResult[],
} & EntranceTestStudent