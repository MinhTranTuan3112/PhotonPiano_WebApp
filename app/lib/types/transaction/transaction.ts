
export type Transaction = {
    id: string;
    description?: string | null;
    transactionType: TransactionType;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    transactionCode?: string | null;
    amount: number;
    createdById: string;
    createdByEmail: string;
    tutionId?: string | null;
    entranceTestStudentId?: string | null;
    createdAt: string;
    updatedAt?: string | null;
    deletedAt?: string | null;
    recordStatus: number;
};

export enum TransactionType {
    EntranceTestFee = 0,
    TutionFee = 1,
}

export enum PaymentMethod {
    Cash = 0,
    VnPay = 1
}

export enum PaymentStatus {
    Pending = 0,
    Successed = 1,
    Failed = 2,
    Canceled = 3
}

export const sampleTransactions: Transaction[] = [
    {
        id: "1",
        description: "Tuition payment for semester 1",
        transactionType: 1,
        paymentMethod: PaymentMethod.VnPay,
        paymentStatus: PaymentStatus.Successed,
        transactionCode: "TRX12345",
        amount: 5000,
        createdById: "USER001",
        createdByEmail: "user1@example.com",
        tutionId: "TUTION001",
        entranceTestStudentId: null,
        createdAt: "2025-01-24T08:00:00Z",
        updatedAt: null,
        deletedAt: null,
        recordStatus: 1,
    },
    {
        id: "2",
        description: "Entrance test fee",
        transactionType: 0,
        paymentMethod: PaymentMethod.Cash,
        paymentStatus: PaymentStatus.Successed,
        transactionCode: "TRX12346",
        amount: 200,
        createdById: "USER002",
        createdByEmail: "user2@example.com",
        tutionId: null,
        entranceTestStudentId: "TEST001",
        createdAt: "2025-01-23T10:00:00Z",
        updatedAt: null,
        deletedAt: null,
        recordStatus: 1,
    },
    {
        id: "3",
        description: "Late payment fee",
        transactionType: 1,
        paymentMethod: PaymentMethod.VnPay,
        paymentStatus: PaymentStatus.Pending,
        transactionCode: "TRX12347",
        amount: 50,
        createdById: "USER003",
        createdByEmail: "user3@example.com",
        tutionId: null,
        entranceTestStudentId: null,
        createdAt: "2025-01-22T09:00:00Z",
        updatedAt: null,
        deletedAt: null,
        recordStatus: 0,
    },
    {
        id: "4",
        description: null,
        transactionType: 1,
        paymentMethod: PaymentMethod.Cash,
        paymentStatus: PaymentStatus.Failed,
        transactionCode: null,
        amount: 3000,
        createdById: "USER004",
        createdByEmail: "user4@example.com",
        tutionId: "TUTION002",
        entranceTestStudentId: null,
        createdAt: "2025-01-21T15:00:00Z",
        updatedAt: null,
        deletedAt: "2025-01-22T16:00:00Z",
        recordStatus: 2,
    },
    {
        id: "5",
        description: "Refund for test cancellation",
        transactionType: 1,
        paymentMethod: PaymentMethod.Cash,
        paymentStatus: PaymentStatus.Canceled,
        transactionCode: "TRX12348",
        amount: -100,
        createdById: "USER005",
        createdByEmail: "user5@example.com",
        tutionId: null,
        entranceTestStudentId: "TEST002",
        createdAt: "2025-01-20T12:30:00Z",
        updatedAt: "2025-01-21T14:00:00Z",
        deletedAt: null,
        recordStatus: 1,
    },
    {
        id: "6",
        description: "Partial payment for tuition",
        transactionType: 1,
        paymentMethod: PaymentMethod.VnPay,
        paymentStatus: PaymentStatus.Successed,
        transactionCode: "TRX12349",
        amount: 2500,
        createdById: "USER006",
        createdByEmail: "user6@example.com",
        tutionId: "TUTION003",
        entranceTestStudentId: null,
        createdAt: "2025-01-19T11:00:00Z",
        updatedAt: null,
        deletedAt: null,
        recordStatus: 1,
    },
    {
        id: "7",
        description: "Tuition fee for new enrollment",
        transactionType: 1,
        paymentMethod: PaymentMethod.Cash,
        paymentStatus: PaymentStatus.Pending,
        transactionCode: null,
        amount: 4000,
        createdById: "USER007",
        createdByEmail: "user7@example.com",
        tutionId: "TUTION004",
        entranceTestStudentId: null,
        createdAt: "2025-01-18T14:00:00Z",
        updatedAt: null,
        deletedAt: null,
        recordStatus: 0,
    },
    {
        id: "8",
        description: "Penalty for late submission",
        transactionType: 1,
        paymentMethod: PaymentMethod.Cash,
        paymentStatus: PaymentStatus.Successed,
        transactionCode: "TRX12350",
        amount: 100,
        createdById: "USER008",
        createdByEmail: "user8@example.com",
        tutionId: null,
        entranceTestStudentId: null,
        createdAt: "2025-01-17T10:15:00Z",
        updatedAt: null,
        deletedAt: null,
        recordStatus: 1,
    },
    {
        id: "9",
        description: null,
        transactionType: 1,
        paymentMethod: PaymentMethod.VnPay,
        paymentStatus: PaymentStatus.Failed,
        transactionCode: "TRX12351",
        amount: 300,
        createdById: "USER009",
        createdByEmail: "user9@example.com",
        tutionId: null,
        entranceTestStudentId: "TEST003",
        createdAt: "2025-01-16T08:00:00Z",
        updatedAt: "2025-01-16T09:00:00Z",
        deletedAt: null,
        recordStatus: 2,
    },
    {
        id: "10",
        description: "Full payment for semester 2",
        transactionType: 1,
        paymentMethod: PaymentMethod.VnPay,
        paymentStatus: PaymentStatus.Successed,
        transactionCode: "TRX12352",
        amount: 6000,
        createdById: "USER010",
        createdByEmail: "user10@example.com",
        tutionId: "TUTION005",
        entranceTestStudentId: null,
        createdAt: "2025-01-15T13:00:00Z",
        updatedAt: null,
        deletedAt: null,
        recordStatus: 1,
    },
];
