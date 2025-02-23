import { addDays } from 'date-fns';
import { z } from 'zod';
import { ImageFile } from '~/hooks/use-images-dialog';

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
        gender: z.coerce.number(),
        dateOfBirth: z.coerce.date(),
    });


export const createEntranceTestSchema = z.object({
    name: z.string({ message: 'Tên đợt thi không được để trống.' }).min(1, { message: 'Tên đợt thi không được để trống.' }),
    date: z.coerce.date({ message: 'Ngày thi không được để trống.' }).min(new Date(), { message: 'Ngày thi phải sau hôm nay.' }),
    shift: z.string({ message: 'Vui lòng chọn ca thi.' }).min(1, { message: 'Ca thi không được để trống.' }),
    roomId: z.string({ message: 'Vui lòng chọn phòng thi.' }).min(1, { message: 'Phòng thi không được để trống.' }),
    instructorId: z.string({ message: 'Vui lòng chọn người gác thi.' }).min(1, { message: 'Người coi thi không được để trống.' }).optional(),
});

export const enrollSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ' }).min(1, { message: 'Email không được để trống' }),
    phone: z.string({ message: 'Số điện thoại không được để trống.' }).min(10, { message: 'Số điện thoại không hợp lệ.' }).max(12, { message: 'Số điện thoại không hợp lệ.' }),
});

export const surveySchema = z.object({
    level: z.string({ message: 'Vui lòng chọn trình độ của bạn.' })
        .nonempty({ message: 'Vui lòng chọn trình độ của bạn.' }), // Changed to nonempty
    targets: z.array(z.string({ message: 'Vui lòng chọn mục tiêu của bạn.' })).min(1, { message: 'Vui lòng chọn ít nhất một mục tiêu của bạn.' }), // Ensure at least one target is selected
    favoriteGenres: z.array(z.string().nonempty({ message: 'Vui lòng chọn thể loại nhạc yêu thích của bạn.' })) // Validate each string in array
        .min(1, { message: 'Vui lòng chọn ít nhất một thể loại nhạc yêu thích của bạn.' }), // Ensure at least one genre is selected
    learningMethods: z.array(z.string({ message: 'Vui lòng chọn phương pháp học của bạn.' })).min(1, { message: 'Vui lòng chọn ít nhất một phương pháp học của bạn.' }),
    fullName: z.string({ message: 'Vui lòng nhập họ và tên của bạn.' }).min(1, { message: 'Vui lòng nhập họ và tên của bạn.' }),
    email: z.string({ message: 'Email không được để trống' }).email({ message: 'Email không hợp lệ' }),
    password: z.string({ message: 'Mật khẩu không được để trống' }).min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' }),
    confirmPassword: z.string({ message: 'Xác nhận mật khẩu không được để trống' }).min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' }),
    phone: z.string({ message: 'Số điện thoại không được để trống.' }).min(10, { message: 'Số điện thoại không hợp lệ.' }),
    shortDescription: z.string({ message: 'Vui lòng giới thiệu về bản thân.' }).min(1, { message: 'Vui lòng giới thiệu về bản thân.' }),
    isTermsAgreed: z.literal<boolean>(true, { errorMap: () => ({ message: "Vui lòng đọc và chấp thuận với điều khoản, chính sách của Photon Piano", }), }),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
});

export type SurveyFormData = z.infer<typeof surveySchema>;

export type CreateEntranceTestFormData = z.infer<typeof createEntranceTestSchema>;

export const entranceTestArrangementSchema = z.object({
    date: z.object({
        from: z.date({ message: 'Ngày thi không được để trống.' }),
        to: z.date({ message: 'Ngày thi không được để trống.' }),
    }, {
        message: 'Vui lòng chọn đợt thi.',
    }).refine(
        (data) => data.from > addDays(new Date(), -1),
        "Ngày thi phải sau hôm nay"
    ),
    shiftOptions: z.array(z.string()).optional(),
    studentIds: z.array(z.string()).min(1, { message: 'Vui lòng chọn ít nhất một học viên.' }),
})



export type EntranceTestArrangementFormData = z.infer<typeof entranceTestArrangementSchema>;
