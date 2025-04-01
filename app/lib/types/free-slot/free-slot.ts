import { Shift } from "../Scheduler/slot"

export type FreeSlot = {
    id : string,
    dayOfWeek : number,
    shift : Shift,
    accountId : string
}

export type CreateFreeSlot = {
    dayOfWeek : number,
    shift : Shift,
}