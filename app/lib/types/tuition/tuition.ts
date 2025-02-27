

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

export type StudentClass = {
    id: string;
    classId: string;
    studentFirebaseId: string;
    certificateUrl: string;
    isPassed: boolean;
    className: string;
}