import { z } from "zod";
import { Account } from "../account/account";
import { Room } from "../room/room";
import { EntranceTestStudent } from "./entrance-test-student";

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
    isAnnoucedScore: boolean,
    isOpen: boolean
}

export type CreateEntranceTest = {

} & Omit<EntranceTest, 'id' | 'roomName' | 'instructorName' | 'status' | 'registerStudents'>;

export type UpdateEntranceTest = {

} & Partial<Omit<EntranceTest, 'roomName' | 'instructorName' | 'status' | 'registerStudents' | 'isAnnoucedScore' | 'isOpen' | 'roomCapacity'>>;

export const updateEntranceTestSchema = z.object({
    name: z.string({ message: 'Tên đợt thi không được để trống.' }).nonempty({ message: 'Tên đợt thi không được để trống.' }),
    shift: z.string({ message: 'Ca thi không được để trống.' }).nonempty({ message: 'Ca thi không được để trống.' }),
    date: z.date(),
    roomId: z.string().nonempty(),
    instructorId: z.string().optional().nullable(),
});

export type UpdateEntranceTestFormData = z.infer<typeof updateEntranceTestSchema>;

export type EntranceTestDetails = {
    entranceTestStudents: EntranceTestStudent[];
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
        isAnnoucedScore: true,
        isOpen: true
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
        isAnnoucedScore: true,
        isOpen: true
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
        isAnnoucedScore: true,
        isOpen: true
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
        isAnnoucedScore: true,
        isOpen: true
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
        isAnnoucedScore: true,
        isOpen: true
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
        isAnnoucedScore: true,
        isOpen: true
    },
    {
        id: "g",
        name: "Kiểm tra đầu vào 7",
        shift: 3,
        date: "2025-02-02",
        status: 0,
        registerStudents: 5,
        isAnnoucedScore: true,
        isOpen: true
    }
]