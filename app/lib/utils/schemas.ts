import { addDays } from 'date-fns';
import { z } from 'zod';

export const signInSchema = z.object({
    email: z.string().trim().email({ message: 'Invalid email' }).min(1, { message: 'Email cannot be empty' }),
    password: z.string().min(6, { message: 'Password must have at least 6 characters' }),
});

export const accountInfoSchema = z
    .object({
        avatarUrl: z.string().optional(), // Optional URL for existing avatar
        email: z
            .string({ message: "Email không được để trống." })
            .email({ message: "Email không hợp lệ." }),
        fullName: z
            .string({ message: "Họ và tên không được để trống." })
            .min(1, { message: "Họ và tên không được để trống." }),
        userName: z
            .string({ message: "Tên người dùng không được để trống." })
            .min(1, { message: "Tên người dùng không được để trống." }),
        phone: z
            .string({ message: "Số điện thoại không được để trống." })
            .min(10, { message: "Số điện thoại không hợp lệ." }),
        address: z
            .string({ message: "Địa chỉ không được để trống." })
            .min(1, { message: "Địa chỉ không được để trống." }),
        shortDescription: z
            .string({ message: "Vui lòng giới thiệu về bản thân." })
            .min(1, { message: "Vui lòng giới thiệu về bản thân." }),
        gender: z.coerce.number({ message: "Vui lòng chọn giới tính." }),
        dateOfBirth: z.coerce.date({ message: "Vui lòng chọn ngày sinh." }),
    });


export const createEntranceTestSchema = z.object({
    name: z.string({ message: 'Tên đợt thi không được để trống.' }).min(1, { message: 'Tên đợt thi không được để trống.' }),
    date: z.coerce.date({ message: 'Ngày thi không được để trống.' }).min(new Date(), { message: 'Ngày thi phải sau hôm nay.' }),
    shift: z.string({ message: 'Vui lòng chọn ca thi.' }).min(1, { message: 'Ca thi không được để trống.' }),
    roomId: z.string({ message: 'Vui lòng chọn phòng thi.' }).min(1, { message: 'Phòng thi không được để trống.' }),
    roomName: z.string(),
    instructorId: z.string({ message: 'Vui lòng chọn người gác thi.' }).min(1, { message: 'Người coi thi không được để trống.' }).optional(),
    studentIds: z.array(z.string())
});

export const enrollSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ' }).min(1, { message: 'Email không được để trống' }),
    phone: z.string({ message: 'Số điện thoại không được để trống.' }).min(10, { message: 'Số điện thoại không hợp lệ.' }).max(12, { message: 'Số điện thoại không hợp lệ.' }),
});

export type CreateEntranceTestFormData = z.infer<typeof createEntranceTestSchema>;

export const entranceTestArrangementSchema = z.object({
    date: z.object({
        from: z.coerce.date({ message: 'Invalid date.' }),
        to: z.coerce.date({ message: 'Invalid date.' }).optional(),
    }).refine(
        (data) => data.from > addDays(new Date(), -1),
        { message: 'Test date must be after today', path: ['from'] }
    ),
    shiftOptions: z.array(z.string()).optional(),
    studentIds: z.array(z.string()).min(1, { message: 'Please select at least 1 learner.' }),
})

export type EntranceTestArrangementFormData = z.infer<typeof entranceTestArrangementSchema>;
