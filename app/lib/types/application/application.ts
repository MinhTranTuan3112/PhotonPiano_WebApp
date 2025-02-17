import { z } from "zod";
import { BaseType } from "../base-type";

export type Application = {
    id: string;
    type: ApplicationType;
    reason: string;
    fileUrl?: string;
    status: ApplicationStatus;
    createdByEmail: string;
    updatedByEmail?: string;
    approvedByEmail?: string;
    approvedById?: string;
} & Omit<BaseType, 'deletedById' | 'deletedAt'>;

export type SendApplicationRequest = {
    file?: File;
} & Pick<Application, 'type' | 'reason'>;

export const sendApplicationSchema = z.object({
    type: z.coerce.number({ message: 'Vui lòng chọn loại đơn.' }),
    reason: z.string({ message: 'Vui lòng nhập lý do.' }).nonempty({ message: 'Vui lòng nhập lý do.' }),
    file: z
    .instanceof(File, { message: "file không hợp lệ" })
    .optional() 
});

export type SendApplicationFormData = z.infer<typeof sendApplicationSchema>;

export enum ApplicationType {
    LeaveOfAbsence, // Đơn tạm nghỉ
    TemporarySuspensionOfTerm, // Đơn tạm hoãn kì
    ReexamineEntranceScore, // Đơn xin phúc tra điểm đầu vào
    ReexamineFinalExamScores, // Đơn xin phúc tra điểm thi
    ClassTransfer, // Đơn xin chuyển lớp
    TeacherComplaint, // Đơn khiếu nại giáo viên
    ServiceComplaint, // Đơn khiếu nại csvc
    Other, // Các loại đơn khác
    CertificateErrorReport // Báo cáo sai sót chứng chỉ
}

export enum ApplicationStatus {
    Pending,
    Approved,
    Rejected,
    Cancelled
}

export const sampleApplications: Application[] = [
    {
        id: "app-001",
        type: ApplicationType.LeaveOfAbsence,
        reason: "Family emergency, need to take a temporary leave.",
        fileUrl: "https://example.com/documents/leave_request.pdf",
        status: ApplicationStatus.Pending,
        createdByEmail: "student1@example.com",
        updatedByEmail: "admin@example.com",
        approvedByEmail: undefined,
        approvedById: undefined,
        createdAt: "2024-01-10T09:00:00Z",
        updatedAt: "2024-01-12T10:30:00Z",
        createdById: "user-001",
        updatedById: "admin-001"
    },
    {
        id: "app-002",
        type: ApplicationType.ReexamineFinalExamScores,
        reason: "I believe there was a miscalculation in my final exam score.",
        fileUrl: "https://example.com/documents/reexamine_request.pdf",
        status: ApplicationStatus.Approved,
        createdByEmail: "student2@example.com",
        updatedByEmail: "admin@example.com",
        approvedByEmail: "teacher@example.com",
        approvedById: "teacher-001",
        createdAt: "2024-02-05T11:20:00Z",
        updatedAt: "2024-02-06T08:45:00Z",
        createdById: "user-002",
        updatedById: "admin-001"
    },
    {
        id: "app-003",
        type: ApplicationType.ClassTransfer,
        reason: "Requesting a class transfer due to schedule conflict.",
        fileUrl: undefined,
        status: ApplicationStatus.Rejected,
        createdByEmail: "student3@example.com",
        updatedByEmail: "admin@example.com",
        approvedByEmail: undefined,
        approvedById: undefined,
        createdAt: "2024-03-01T14:00:00Z",
        updatedAt: "2024-03-03T09:10:00Z",
        createdById: "user-003",
        updatedById: "admin-002"
    },
    {
        id: "app-004",
        type: ApplicationType.TeacherComplaint,
        reason: "The instructor was not responsive during the course.",
        fileUrl: "https://example.com/documents/complaint_teacher.pdf",
        status: ApplicationStatus.Pending,
        createdByEmail: "student4@example.com",
        updatedByEmail: undefined,
        approvedByEmail: undefined,
        approvedById: undefined,
        createdAt: "2024-04-15T13:15:00Z",
        updatedAt: "2024-04-15T13:15:00Z",
        createdById: "user-004",
        updatedById: undefined
    },
    {
        id: "app-005",
        type: ApplicationType.CertificateErrorReport,
        reason: "There is an incorrect spelling of my name on the certificate.",
        fileUrl: "https://example.com/documents/certificate_error.pdf",
        status: ApplicationStatus.Cancelled,
        createdByEmail: "student5@example.com",
        updatedByEmail: "admin@example.com",
        approvedByEmail: undefined,
        approvedById: undefined,
        createdAt: "2024-05-20T16:45:00Z",
        updatedAt: "2024-05-22T09:30:00Z",
        createdById: "user-005",
        updatedById: "admin-003"
    }
];