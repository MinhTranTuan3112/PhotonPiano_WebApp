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
        deadline: string;
        fee: number;
    }

    export enum PaymentStatus  {
        Pending,
        Successed,
        Failed,
        Canceled
    }

    export const PaymentStatusText = {
        [PaymentStatus.Pending]: "Waiting",
        [PaymentStatus.Successed]: "Success",
        [PaymentStatus.Failed]: "Failed",
        [PaymentStatus.Canceled]: "Canceled"
    };


    export type StudentClass = {
        id: string;
        classId: string;
        studentFirebaseId: string;
        studentFullName: string;
        studentEmail: string;
        certificateUrl: string;
        isPassed: boolean;
        className: string;
    }