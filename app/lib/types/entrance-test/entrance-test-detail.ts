import { Account } from "../account/account"
import { Room } from "../room/room"
import { EntranceTest } from "./entrance-test"
import { EntranceTestResult } from "./entrance-test-result"
import { EntranceTestStudentDetails } from "./entrance-test-student"

export type EntranceTestDetail = {
    entranceTestStudents : EntranceTestStudentDetails[],
    instructor? : Account,    
    room? : Room
} & EntranceTest