
import { Slot } from "../Scheduler/slot";
import { Class } from "./class";
import { StudentClassWithStudent } from "./student-class";

export type ClassDetail = {
    slots : Slot[],
    studentClasses : StudentClassWithStudent[],
    
} & Class