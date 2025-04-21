import { zodResolver } from '@hookform/resolvers/zod';
import { FetcherWithComponents, Form } from '@remix-run/react';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export const tuitionConfigSchema = z.object({
    taxRate2025: z.coerce.number().min(0, { message: 'Thuế suất không được âm' }).max(1, { message: 'Thuế suất không được lớn hơn 1' }),
    paymentDeadlineDays: z.coerce.number().min(1, { message: 'Hạn chót thanh toán phải lớn hơn 0' }),
    paymentReminderDay: z.coerce.number().min(1, { message: 'Ngày nhắc thanh toán phải lớn hơn 0' }).max(31, { message: 'Ngày nhắc không được lớn hơn 31' }),
    trialSessionCount: z.coerce.number().min(1, { message: 'Số buổi học thử phải lớn hơn 0' }),
});

export type TuitionConfigFormData = z.infer<typeof tuitionConfigSchema>;

type Props = {
    fetcher: FetcherWithComponents<any>;
    isSubmitting: boolean;   
    idToken: string;
} & Partial<TuitionConfigFormData>;

export default function TuitionConfigForm({ fetcher, isSubmitting, idToken,...defaultData }: Props) {

    const {
        handleSubmit,
        formState: { errors },
        control,
        register,
    } = useRemixForm<TuitionConfigFormData & { module: string }>({
        mode: 'onSubmit',
        resolver: zodResolver(tuitionConfigSchema.extend({
            module: z.string()
        })),
        defaultValues: {
            module: 'tuition',
            ...defaultData
        },
        submitConfig: {
            action: '/admin/settings',
            method: "POST"
        },
        fetcher
    });

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Lưu cấu hình',
        description: 'Bạn có chắc chắn muốn lưu cấu hình này không?',
        onConfirm: handleSubmit,
    });
    

    return (
        <>
            <h2 className="text-base font-bold">Cấu hình học phí</h2>
            <p className='text-sm text-muted-foreground'>Quản lý cấu hình hệ thống liên quan đến học phí và thuế</p>

            <Form method='POST' className='my-4 flex flex-col gap-5'>
 

                <div className="flex flex-row">
                    <Label className='w-[25%] flex items-center'>Thuế suất năm 2025:</Label>
                    <div className='flex flex-col'>
                        <Input {...register('taxRate2025')}
                               placeholder='Nhập thuế suất...'
                               type='number'
                               step='0.01'
                               min='0'
                               max='1'
                               className='max-w-full' />
                        <p className='text-xs text-muted-foreground'>Giá trị từ 0 đến 1 (Ví dụ: 0.05 tương đương 5%)</p>
                    </div>
                </div>
                {errors.taxRate2025 && <p className='text-red-500 text-sm'>{errors.taxRate2025.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[25%] flex items-center'>Số buổi học thử:</Label>
                    <Input {...register('trialSessionCount')}
                           placeholder='Nhập số buổi...'
                           type='number'
                           min='1'
                           className='max-w-[20%]' />
                </div>
                {errors.trialSessionCount && <p className='text-red-500 text-sm'>{errors.trialSessionCount.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[25%] flex items-center'>Hạn chót thanh toán học phí:</Label>
                    <div className='flex flex-row items-center gap-2'>
                        <Input {...register('paymentDeadlineDays')}
                               placeholder='Nhập số ngày...'
                               type='number'
                               className='w-24' />
                    </div>
                </div>
                {errors.paymentDeadlineDays && <p className='text-red-500 text-sm'>{errors.paymentDeadlineDays.message}</p>}

                {/*<div className="flex flex-row">*/}
                {/*    <Label className='w-[25%] flex items-center'>Ngày nhắc thanh toán học phí:</Label>*/}
                {/*    <div className='flex flex-row items-center gap-2'>*/}
                {/*        <Input {...register('paymentReminderDay')}*/}
                {/*               placeholder='Nhập ngày...'*/}
                {/*               type='number'*/}
                {/*               min='1'*/}
                {/*               max='31'*/}
                {/*               className='w-24' />*/}
                {/*        <span>hàng tháng</span>*/}
                {/*    </div>*/}
                {/*</div>*/}
                {/*{errors.paymentReminderDay && <p className='text-red-500 text-sm'>{errors.paymentReminderDay.message}</p>}*/}
                

                <div className="my-2">
                    <Button type='button' isLoading={isSubmitting} disabled={isSubmitting}
                            onClick={handleOpenConfirmDialog}>
                        {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </div>
            </Form>

            {confirmDialog}
        </>
    );
}
