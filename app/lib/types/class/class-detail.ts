
import { Slot } from "../Scheduler/slot";
import { Class } from "./class";
import { StudentClassDetails, StudentClassWithScore } from "./student-class";

export type ClassDetail = {
    pricePerSlots : number,
    slotsPerWeek : number,
    slots : Slot[],
    studentClasses : StudentClassDetails[]
} & Class

export type ClassScoreDetail = {
    studentClasses : StudentClassWithScore[]
} & Class