
import { Slot } from "../Scheduler/slot";
import { Class } from "./class";
import { StudentClassWithScore, StudentClassWithStudent } from "./student-class";

export type ClassDetail = {
    pricePerSlots : number,
    slotsPerWeek : number,
    slots : Slot[],
    studentClasses : StudentClassWithStudent[]
} & Class

export type ClassScoreDetail = {
    studentClasses : StudentClassWithScore[]
} & Class