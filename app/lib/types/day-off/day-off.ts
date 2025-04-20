import { z } from "zod";

export type DayOff = {
    id: string;
    name: string,
    startTime: string,
    endTime: string,
    createdAt: string,
    createdById: string
}

export type CreateDayOffRequest = Pick<DayOff, "name" | "startTime" | "endTime">;

export type UpdateDayOffRequest = Partial<CreateDayOffRequest> & {
    id: string;
}

export const dayOffSchema = z.object({
    dayOffAction: z.string(),
    id: z.string().optional(),
    name: z.string(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date()
});

export type DayOffFormData = z.infer<typeof dayOffSchema>;