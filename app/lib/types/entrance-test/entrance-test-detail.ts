import { Account } from "../account/account"
import { EntranceTest } from "./entrance-test"
import { EntranceTestResult } from "./entrance-test-result"

export type EntranceTestDetail = {
    students : Account[],
    instructor? : Account,
    entranceTestResult : EntranceTestResult[],
    bandScore? : number,
    rank? : number,
    instructorComment? : string
} & EntranceTest