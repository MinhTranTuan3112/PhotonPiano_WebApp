export enum SlotStatus
{
    NotStarted,
    Ongoing,
    Finished
}

export enum AttendanceStatus {
    NotYet,
    Attended,
    Absent
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

export type Slot = {
    id: string;
    classId: string | null;
    roomId: string | null;
    shift: Shift;
    date: string;
    status: SlotStatus;
    room: {
        id: string;
        name: string;
        status: number;
    };
    class: {
        id: string;
        name: string;
        level: number;
    };
    attendanceStatus?: AttendanceStatus;
};

export type SlotStudentModel = {
    slotId : string;
    studentFirebaseId: string;
    attendanceStatus: number;
    studentAccount: {
        userName: string | null;
        email: string
        avatarUrl : string | null
    }
};

export type StudentAttendanceModel =  {
    studentFirebaseId: string;
    attendanceStatus: AttendanceStatus;
}

export type SlotDetail = {
    id: string;
    classId: string | null;
    roomId: string | null;
    shift: Shift;
    date: string;
    status: SlotStatus;
    room: {
        id: string;
        name: string;
        status: number;
        capacity: number;
    };
    class: {
        id: string;
        instructorId: string;
        instructorName: string;
        status: number;
        name: string;
        level: number;
    };
    slotStudents: SlotStudentModel[] | null;
    numberOfStudents: number;
    attendanceStatus?: AttendanceStatus;
}


export const sampleSlots: Slot[] = [
    {
        id: '1',
        classId: 'class-1',
        roomId: 'room-101',
        shift: Shift.Shift1_7h_8h30,
        date: '2025-01-27',
        status: SlotStatus.NotStarted,
        room: {
            id: 'room-101',
            name: 'Room 101',
            status: 1,
        },
        class: {
            id: 'class-1',
            name: 'Piano Beginner Class',
            level: 0,
        },
    },
    {
        id: '2',
        classId: 'class-2',
        roomId: 'room-102',
        shift: Shift.Shift2_8h45_10h15,
        date: '2025-01-28',
        status: SlotStatus.NotStarted,
        room: {
            id: 'room-102',
            name: 'Room 102',
            status: 0,
        },
        class: {
            id: 'class-2',
            name: 'Piano Intermediate Class',
            level: 1,
        },
    },
    {
        id: '3',
        classId: 'class-1',
        roomId: 'room-101',
        shift: Shift.Shift3_10h45_12h,
        date: '2025-01-29',
        status: SlotStatus.Ongoing,
        room: {
            id: 'room-101',
            name: 'Room 101',
            status: 0,
        },
        class: {
            id: 'class-1',
            name: 'Piano Beginner Class',
            level: 0,
        },
    },
    {
        id: '4',
        classId: 'class-3',
        roomId: 'room-103',
        shift: Shift.Shift4_12h30_14h00,
        date: '2025-01-30',
        status: SlotStatus.NotStarted,
        room: {
            id: 'room-103',
            name: 'Room 103',
            status: 1,
        },
        class: {
            id: 'class-3',
            name: 'Piano Advanced Class',
            level: 3,
        },
    },
    {
        id: '5',
        classId: 'class-2',
        roomId: 'room-102',
        shift: Shift.Shift5_14h15_15h45,
        date: '2025-01-31',
        status: SlotStatus.Ongoing,
        room: {
            id: 'room-102',
            name: 'Room 102',
            status: 0,
        },
        class: {
            id: 'class-2',
            name: 'Piano Intermediate Class',
            level: 1,
        },
    },
    {
        id: '6',
        classId: 'class-1',
        roomId: 'room-101',
        shift: Shift.Shift6_16h00_17h30,
        date: '2025-02-01',
        status: SlotStatus.NotStarted,
        room: {
            id: 'room-101',
            name: 'Room 101',
            status: 1,
        },
        class: {
            id: 'class-1',
            name: 'Piano Beginner Class',
            level: 0,
        },
    },
    {
        id: '7',
        classId: 'class-3',
        roomId: 'room-103',
        shift: Shift.Shift7_18h_19h30,
        date: '2025-02-02',
        status: SlotStatus.Ongoing,
        room: {
            id: 'room-103',
            name: 'Room 103',
            status: 0,
        },
        class: {
            id: 'class-3',
            name: 'Piano Advanced Class',
            level: 3,
        },
    },
];