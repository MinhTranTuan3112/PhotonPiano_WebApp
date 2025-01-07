import { z } from 'zod';

export const signInSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ' }).min(1, { message: 'Email không được để trống' }),
    password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
});

export const signUpSchema = z.object({
    email: z.string({ message: 'Email không được để trống' }).email({ message: 'Email không hợp lệ' }),
    password: z.string({ message: 'Mật khẩu không được để trống' }).min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' }),
    confirmPassword: z.string({ message: 'Xác nhận mật khẩu không được để trống' }).min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' }),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
});

export const accountInfoSchema = z.object({
    email: z.string({ message: 'Email không được để trống.' }).email({ message: 'Email không hợp lệ.' }),
    username: z.string({ message: 'Tên người dùng không được để trống.' }).min(1, { message: 'Tên người dùng không được để trống.' }),
    phone: z.string({ message: 'Số điện thoại không được để trống.' }).min(10, { message: 'Số điện thoại không hợp lệ.' }),
    address: z.string({ message: 'Địa chỉ không được để trống.' }).min(1, { message: 'Địa chỉ không được để trống.' }),
})

export const createEntranceTestSchema = z.object({
    name: z.string({ message: 'Tên đợt thi không được để trống.' }).min(1, { message: 'Tên đợt thi không được để trống.' }),
    date: z.coerce.date({ message: 'Ngày thi không được để trống.' }).min(new Date(), { message: 'Ngày thi phải sau hôm nay.' }),
    shift: z.string({ message: 'Vui lòng chọn ca thi.' }).min(1, { message: 'Ca thi không được để trống.' }),
    roomId: z.string({ message: 'Vui lòng chọn phòng thi.' }).min(1, { message: 'Phòng thi không được để trống.' }),
    roomCapacity: z.string({ message: 'Sức chứa không được để trống.' }).optional(),
    instructorId: z.string({ message: 'Vui lòng chọn người gác thi.' }).min(1, { message: 'Người coi thi không được để trống.' }),
});

export type CreateEntranceTestFormData = z.infer<typeof createEntranceTestSchema>;