
import { Slot } from "../Scheduler/slot";
import { Class } from "./class";
import { StudentClassWithStudent } from "./student-class";

export type ClassDetail = {
    pricePerSlots : number,
    slotsPerWeek : number,
    slots : Slot[],
    studentClasses : StudentClassWithStudent[],
    
} & Class