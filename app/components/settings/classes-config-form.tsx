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
    maximumClassSize: z.coerce.number().min(1, { message: 'Số lượng học viên tối đa phải lớn hơn 0' }),
    minimumClassSize: z.coerce.number().min(0, { message: 'Số lượng học viên tối thiểu không âm' }),
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
        title: 'Save Changes',
        description: 'Do you want to save changes?',
        onConfirm: handleSubmit,
    });

    return (
        <>
            <h2 className="text-base font-bold">Class Config</h2>
            <p className='text-sm text-muted-foreground'>Handle configurations that are related to placement or classes</p>

            <Form method='POST' className='my-4'>
                <div>
                    <div className="flex flex-row mb-4 gap-2">
                        <Label className='w-1/2 lg:w-1/4 flex items-center'>Maximum Class Size:</Label>
                        <Input {...register('maximumClassSize')}
                            placeholder='Enter a value...'
                            type='number'
                            className='w-36' />
                        {errors.maximumClassSize && <p className='text-red-500 text-sm'>{errors.maximumClassSize.message}</p>}
                    </div>
                    <div className="flex flex-row mb-4 gap-2">
                        <Label className='w-1/2 lg:w-1/4 flex items-center'>Minimum Class Size:</Label>
                        <Input {...register('minimumClassSize')}
                            placeholder='Enter a value...'
                            type='number'
                            className='w-36' />
                        {errors.minimumClassSize && <p className='text-red-500 text-sm'>{errors.minimumClassSize.message}</p>}
                    </div>
                    <div className="flex flex-row mb-4 gap-2">
                        <Label className='w-1/2 lg:w-1/4 flex items-center'>Allowed to study beyond level: </Label>
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
                        <Label className='flex items-center'>Deadline For Changing Class </Label>
                        <div>
                            <Input {...register('deadlineChangingClass')}
                                placeholder='Enter a value...'
                                type='number'
                                className='w-24' />
                            {errors.deadlineChangingClass && <p className='text-red-500 text-sm'>{errors.deadlineChangingClass.message}</p>}
                        </div>

                        <Label className='w-1/2 lg:w-1/4 flex items-center'> days before the current class begin.</Label>

                    </div>
                </div>

                <Button type='button' isLoading={isSubmitting} disabled={isSubmitting}
                    onClick={handleOpenConfirmDialog}>
                    {isSubmitting ? 'Saving...' : 'Save Change'}
                </Button>
            </Form>
            {confirmDialog}
        </>
    )
}