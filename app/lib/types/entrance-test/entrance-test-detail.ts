import { Account } from "../account/account"
import { EntranceTest } from "./entrance-test"

export type EntranceTestDetail = {
    students : Account[],
    instructor? : Account
} & EntranceTest