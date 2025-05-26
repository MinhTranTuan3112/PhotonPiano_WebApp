import { z } from "zod";
import { Account } from "../account/account";
import { Room } from "../room/room";
import { EntranceTestStudentWithResults } from "./entrance-test-student";
import { addDays } from "date-fns";

export type EntranceTest = {
    id: string,
    name: string,
    roomName?: string,
    roomId?: string,
    roomCapacity?: number,
    instructorId?: string,
    instructorName?: string,
    shift: number,
    date: string,
    status: number,
    registerStudents: number,
    isAnnouncedScore: boolean,
    isOpen: boolean
    testStatus: EntranceTestStatus;
}

export enum Shift {
    Shift1_7h_8h30,
    Shift2_8h45_10h15,
    Shift3_10h45_12h,
    Shift4_12h30_14h00,
    Shift5_14h15_15h45,
    Shift6_16h00_17h30,
    Shift7_18h_19h30,
    Shift8_19h45_21h15
}

export enum EntranceTestStatus {
    NotStarted,
    OnGoing,
    Ended
}

export type CreateEntranceTest = {

} & Omit<EntranceTest, 'id' | 'roomName' | 'instructorName' | 'status' | 'registerStudents'>;

export type UpdateEntranceTest = {

} & Partial<Omit<EntranceTest, 'roomName' | 'instructorName' | 'status' | 'registerStudents' | 'isOpen' | 'roomCapacity'>>;

export const updateEntranceTestSchema = z.object({
    name: z.string({ message: 'Test name cannot be empty.' }).nonempty({ message: 'Test name cannot be empty.' }),
    shift: z.string({ message: 'Shift cannot be empty.' }).nonempty({ message: 'Shift cannot be empty.' }),
    date: z.coerce.date().min(addDays(new Date(), 1), { message: 'Test date must be after today.' }),
    roomId: z.string().nonempty(),
    roomName: z.string(),
    isAnnouncedScore: z.boolean().optional(),
    instructorId: z.string().optional().nullable(),
});

export type UpdateEntranceTestFormData = z.infer<typeof updateEntranceTestSchema>;

export type EntranceTestDetails = {
    entranceTestStudents: EntranceTestStudentWithResults[];
    instructor: Account;
    room: Room;
} & EntranceTest;

export const sampleEntranceTests: EntranceTest[] = [
    {
        id: "a",
        name: "Kiểm tra đầu vào 1",
        roomName: "Phòng KTĐV 1",
        roomId: "abc",
        roomCapacity: 20,
        shift: 1,
        date: "2025-02-01",
        status: 0,
        instructorName: "HungDepTrai",
        registerStudents: 20,
        isAnnouncedScore: true,
        isOpen: true,
        testStatus: EntranceTestStatus.NotStarted
    },
    {
        id: "b",
        name: "Kiểm tra đầu vào 2",
        roomName: "Phòng KTĐV 2",
        roomId: "def",
        roomCapacity: 25,
        shift: 1,
        date: "2025-01-01",
        status: 2,
        instructorName: "HungDepTrai",
        registerStudents: 10,
        isAnnouncedScore: true,
        isOpen: true,
        testStatus: EntranceTestStatus.OnGoing
    },
    {
        id: "c",
        name: "Kiểm tra đầu vào 3",
        roomName: "Phòng KTĐV 1",
        roomCapacity: 20,
        roomId: "abc",
        shift: 2,
        date: "2025-02-01",
        status: 0,
        registerStudents: 15,
        isAnnouncedScore: true,
        isOpen: true,
        testStatus: EntranceTestStatus.Ended
    },
    {
        id: "d",
        name: "Kiểm tra đầu vào 4",
        roomName: "Phòng KTĐV 2",
        roomCapacity: 25,
        roomId: "def",
        shift: 2,
        date: "2025-02-01",
        status: 0,
        instructorName: "Thien An",
        registerStudents: 5,
        isAnnouncedScore: true,
        isOpen: true,
        testStatus: EntranceTestStatus.NotStarted
    },
    {
        id: "e",
        name: "Kiểm tra đầu vào 5",
        roomName: "Phòng KTĐV 3",
        roomCapacity: 20,
        roomId: "ghi",
        shift: 3,
        date: "2025-02-02",
        status: 0,
        instructorName: "Thien An",
        registerStudents: 7,
        isAnnouncedScore: true,
        isOpen: true,
        testStatus: EntranceTestStatus.NotStarted
    },
    {
        id: "f",
        name: "Kiểm tra đầu vào 6",
        roomName: "Phòng KTĐV 3",
        roomCapacity: 20,
        roomId: "ghi",
        shift: 4,
        date: "2025-02-02",
        status: 0,
        registerStudents: 8,
        isAnnouncedScore: true,
        isOpen: true,
        testStatus: EntranceTestStatus.NotStarted
    },
    {
        id: "g",
        name: "Kiểm tra đầu vào 7",
        shift: 3,
        date: "2025-02-02",
        status: 0,
        registerStudents: 5,
        isAnnouncedScore: true,
        isOpen: true,
        testStatus: EntranceTestStatus.NotStarted
    }
]