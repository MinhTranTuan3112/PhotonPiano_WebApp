import { Account } from "../account/account";
import { Slot } from "../Scheduler/slot";
import { Class } from "./class";

export type ClassDetail = {
    slots : Slot[],
    students : Account[],
    
} & Class