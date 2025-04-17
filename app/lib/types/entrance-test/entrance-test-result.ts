import { z } from "zod";
import { Criteria } from "../criteria/criteria";

export type EntranceTestResult = {
    id: string,
    entranceTestStudentId: string,
    criteriaId: string,
    criteriaName: string,
    weight: number;
    score: number
}

export type EntranceTestResultWithCriteria = EntranceTestResult & {
    criteria: Criteria;
}

export type UpdateEntranceTestResult = Omit<EntranceTestResult, 'criteriaId' | 'score'>
    & Partial<Pick<EntranceTestResult, 'criteriaId' | 'score'>>;

export const updateEntranceTestResultsSchema = z.object({
    id: z.string(),
    studentId: z.string(),
    entranceTestStudentId: z.string(),
    bandScore: z.coerce.number().min(0, { message: 'Điểm tổng phải >= 0' }).max(10, { message: 'Điểm tổng phải <= 10' }),
    theoraticalScore: z.coerce.number().min(0, { message: 'Điểm lý thuyết phải >= 0' }).max(10, { message: 'Điểm lý thuyết phải <= 10' }),
    instructorComment: z.string().optional(),
    scores: z.array(z.object({
        id: z.string(),
        criteriaId: z.string(),
        criteriaDescription: z.string().optional(),
        criteriaName: z.string().optional(),
        score: z.coerce.number().min(0, { message: 'Điểm phải >= 0' }).max(10, { message: 'Điểm phải <= 10' }),
        weight: z.number()
    })).min(1, { message: 'Phải có ít nhất 1 cột điểm' })
});

export type UpdateEntranceTestResultsFormData = z.infer<typeof updateEntranceTestResultsSchema>;