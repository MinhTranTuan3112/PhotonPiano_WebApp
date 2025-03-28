import { Account } from "../account/account"
import { Room } from "../room/room"
import { EntranceTest } from "./entrance-test"
import { EntranceTestResult } from "./entrance-test-result"
import { EntranceTestStudentWithResults } from "./entrance-test-student"

export type EntranceTestDetail = {
    entranceTestStudents : EntranceTestStudentWithResults[],
    instructor? : Account,    
    room? : Room
} & EntranceTest