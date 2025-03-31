import { zodResolver } from '@hookform/resolvers/zod';
import { FetcherWithComponents, Form } from '@remix-run/react';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Controller } from 'react-hook-form';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';

export const classSettingsSchema = z.object({
    maxStudents: z.coerce.number().min(1, { message: 'Số lượng học viên tối đa phải lớn hơn 0' }),
    minStudents: z.coerce.number().min(1, { message: 'Số lượng học viên tối thiểu phải lớn hơn 0' }),
    deadlineChangingClass: z.coerce.number().min(0, { message: 'Giá trị không âm' }),
    allowSkippingLevel: z.boolean().default(false),
});

export type ClassSettingsFormData = z.infer<typeof classSettingsSchema>;

type Props = {
    fetcher: FetcherWithComponents<any>;
    isSubmitting: boolean;
} & Partial<ClassSettingsFormData>;

export default function ClassesConfigForm({ fetcher, isSubmitting, ...defaultData }: Props) {

    const {
        handleSubmit,
        formState: { errors },
        control,
        register
    } = useRemixForm<ClassSettingsFormData & { module: string }>({
        mode: 'onSubmit',
        resolver: zodResolver(classSettingsSchema.extend({
            module: z.string()
        })),
        fetcher,
        submitConfig: {
            action: '/admin/settings',
            method: 'POST'
        },
        defaultValues: {
            module: 'classes',
            ...defaultData
        }
    });

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Lưu cấu hình',
        description: 'Bạn có chắc chắn muốn lưu cấu hình này không?',
        onConfirm: handleSubmit,
    });

    return (
        <>
            <h2 className="text-base font-bold">Cấu hình lớp</h2>
            <p className='text-sm text-muted-foreground'>Quản lý cấu hình hệ thống liên quan đến xếp lớp và quản lý lớp</p>

            <Form method='POST' className='my-4'>
                <div>
                    <div className="flex flex-row mb-4 gap-2">
                        <Label className='w-1/2 lg:w-1/4 flex items-center'>Sĩ số tối đa cho 1 lớp:</Label>
                        <Input {...register('maxStudents')}
                            placeholder='Nhập giá trị...'
                            type='number'
                            className='w-36' />
                        {errors.maxStudents && <p className='text-red-500 text-sm'>{errors.maxStudents.message}</p>}
                    </div>
                    <div className="flex flex-row mb-4 gap-2">
                        <Label className='w-1/2 lg:w-1/4 flex items-center'>Sĩ số tối thiểu để mở lớp:</Label>
                        <Input {...register('minStudents')}
                            placeholder='Nhập giá trị...'
                            type='number'
                            className='w-36' />
                        {errors.minStudents && <p className='text-red-500 text-sm'>{errors.minStudents.message}</p>}
                    </div>
                    <div className="flex flex-row mb-4 gap-2">
                        <Label className='w-1/2 lg:w-1/4 flex items-center'>Được phép học vượt Level:</Label>
                        <Controller
                            control={control}
                            name='allowSkippingLevel'
                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                <div>
                                    <Switch checked={value} onCheckedChange={onChange}
                                        className='m-0' />
                                </div>
                            )}
                        />
                        {errors.allowSkippingLevel && <p className='text-red-500 text-sm'>{errors.allowSkippingLevel.message}</p>}
                    </div>
                    <div className="flex flex-row mb-4 gap-2">
                        <Label className='flex items-center'>Hạn chót đổi lớp </Label>
                        <div>
                            <Input {...register('deadlineChangingClass')}
                                placeholder='Nhập giá trị...'
                                type='number'
                                className='w-24' />
                            {errors.deadlineChangingClass && <p className='text-red-500 text-sm'>{errors.deadlineChangingClass.message}</p>}
                        </div>

                        <Label className='w-1/2 lg:w-1/4 flex items-center'> ngày trước khi lớp bắt đầu học</Label>

                    </div>
                </div>

                <Button type='button' isLoading={isSubmitting} disabled={isSubmitting}
                    onClick={handleOpenConfirmDialog}>
                    {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                </Button>
            </Form>
            {confirmDialog}
        </>
    )
}