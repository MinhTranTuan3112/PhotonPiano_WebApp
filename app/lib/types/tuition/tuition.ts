import {AttendanceStatus} from "~/lib/types/Scheduler/slot";


export type Tuition = {
    id: string;
    studentClassId: string;
    amount: number;
    startDate: string;
    endDate: string;
    paymentStatus: PaymentStatus;
    className: string;
    isPassed: boolean;
    studentClass: StudentClass;
}

export enum PaymentStatus  {
    Pending,
    Successed,
    Failed,
    Canceled
}

export const PaymentStatusText = {
    [PaymentStatus.Pending]: "Đang tiến hành",
    [PaymentStatus.Successed]: "Thành công",
    [PaymentStatus.Failed]: "Thất bại",
    [PaymentStatus.Canceled]: "Hủy"
};


export type StudentClass = {
    id: string;
    classId: string;
    studentFirebaseId: string;
    studentFullName: string;
    certificateUrl: string;
    isPassed: boolean;
    className: string;
}