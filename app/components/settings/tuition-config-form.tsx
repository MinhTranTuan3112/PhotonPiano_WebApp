import { zodResolver } from '@hookform/resolvers/zod';
import { FetcherWithComponents, Form } from '@remix-run/react';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export const tuitionConfigSchema = z.object({
    taxRate2025: z.coerce.number().min(0, { message: 'Tax rate cannot be negative' }).max(1, { message: 'Tax rate cannot be greater than 1' }),
    paymentDeadlineDays: z.coerce.number().min(1, { message: 'Payment deadline must be greater than 0' }),
    paymentReminderDay: z.coerce.number().min(1, { message: 'Payment reminder day must be greater than 0' }).max(31, { message: 'Reminder day cannot be greater than 31' }),
    trialSessionCount: z.coerce.number().min(1, { message: 'Trial session count must be greater than 0' }),
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
        title: 'Save Configuration',
        description: 'Are you sure you want to save this configuration?',
        onConfirm: handleSubmit,
    });


    return (
        <>
            <h2 className="text-base font-bold">Tuition Fee Configuration</h2>
            <p className='text-sm text-muted-foreground'>Manage system settings related to tuition fees and taxes</p>

            <Form method='POST' className='my-4 flex flex-col gap-5'>

                <div className="flex flex-row">
                    <Label className='w-[25%] flex items-center'>Tax Rate:</Label>
                    <div className='flex flex-col'>
                        <Input {...register('taxRate2025')}
                               placeholder='Enter tax rate...'
                               type='number'
                               step='0.01'
                               min='0'
                               max='1'
                               className='max-w-full' />
                        <p className='text-xs text-muted-foreground'>Value between 0 and 1 (Example: 0.05 equals 5%)</p>
                    </div>
                </div>
                {errors.taxRate2025 && <p className='text-red-500 text-sm'>{errors.taxRate2025.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[25%] flex items-center'>Trial Session Count:</Label>
                    <Input {...register('trialSessionCount')}
                           placeholder='Enter number of sessions...'
                           type='number'
                           min='1'
                           className='max-w-[20%]' />
                </div>
                {errors.trialSessionCount && <p className='text-red-500 text-sm'>{errors.trialSessionCount.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[25%] flex items-center'>Tuition Payment Deadline:</Label>
                    <div className='flex flex-row items-center gap-2'>
                        <Input {...register('paymentDeadlineDays')}
                               placeholder='Enter number of days...'
                               type='number'
                               className='w-24' />
                    </div>
                </div>
                {errors.paymentDeadlineDays && <p className='text-red-500 text-sm'>{errors.paymentDeadlineDays.message}</p>}

                {/*<div className="flex flex-row">*/}
                {/*    <Label className='w-[25%] flex items-center'>Tuition Payment Reminder Day:</Label>*/}
                {/*    <div className='flex flex-row items-center gap-2'>*/}
                {/*        <Input {...register('paymentReminderDay')}*/}
                {/*               placeholder='Enter day...'*/}
                {/*               type='number'*/}
                {/*               min='1'*/}
                {/*               max='31'*/}
                {/*               className='w-24' />*/}
                {/*        <span>monthly</span>*/}
                {/*    </div>*/}
                {/*</div>*/}
                {/*{errors.paymentReminderDay && <p className='text-red-500 text-sm'>{errors.paymentReminderDay.message}</p>}*/}

                <div className="my-2">
                    <Button type='button' isLoading={isSubmitting} disabled={isSubmitting}
                            onClick={handleOpenConfirmDialog}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </Form>

            {confirmDialog}
        </>
    );
}