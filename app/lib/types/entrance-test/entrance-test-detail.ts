import { Account } from "../account/account"
import { Room } from "../room/room"
import { EntranceTest } from "./entrance-test"
import { EntranceTestResult } from "./entrance-test-result"
import { EntranceTestStudentWithScore } from "./entrance-test-student"

export type EntranceTestDetail = {
    entranceTestStudents : EntranceTestStudentWithScore[],
    instructor? : Account,    
    room? : Room
} & EntranceTest