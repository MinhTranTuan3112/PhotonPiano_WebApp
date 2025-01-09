
import { Account } from "../account/account"
import { EntranceTest } from "./entrance-test"
import { EntranceTestDetail } from "./entrance-test-detail"
import { EntranceTestResult } from "./entrance-test-result"

export type EntranceTestStudentDetail = {
    student : Account,
    entranceTest : EntranceTestDetail,
    entranceTestResults : EntranceTestResult[],
    bandScore? : number,
    rank? : number,
    instructorComment? : string,
    
} 