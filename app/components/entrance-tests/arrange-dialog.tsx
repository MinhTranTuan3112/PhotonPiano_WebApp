import React, { SetStateAction, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Form, useFetcher } from '@remix-run/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRemixForm } from 'remix-hook-form'
import { EntranceTestArrangementFormData, entranceTestArrangementSchema } from '~/lib/utils/schemas'
import { Controller } from 'react-hook-form'
import { CalendarSync } from 'lucide-react'
import DateRangePicker from '../ui/date-range-picker'
import { Button } from '../ui/button'
import { MultiSelect } from '../ui/multi-select'
import { SHIFT_TIME } from '~/lib/utils/constants'
import { action } from '~/routes/arrange-entrance-test'
import { toast } from 'sonner'

type Props = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    studentIds: string[];
}

export const resolver = zodResolver(entranceTestArrangementSchema);

export default function ArrangeDialog({ isOpen, setIsOpen, studentIds }: Props) {

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Xếp lịch thi đầu vào</DialogTitle>
                    <DialogDescription>
                        Xếp lịch thi đầu vào cho các học viên đã đăng ký thi đầu vào và chờ xếp lịch
                        dựa trên 2 chế độ là thủ công và tự động.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="auto">
                    <TabsList className="grid w-full grid-cols-2 mb-2">
                        <TabsTrigger value="auto">Tự động</TabsTrigger>
                        <TabsTrigger value="manual">Thủ công</TabsTrigger>
                    </TabsList>
                    <TabsContent value="auto">
                        <AutoArrangementForm studentIds={studentIds} />
                    </TabsContent>
                    <TabsContent value="manual">

                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

function AutoArrangementForm({
    studentIds: initialStudentIds
}: {
    studentIds: string[];
}) {

    const fetcher = useFetcher<typeof action>();

    const {
        handleSubmit,
        formState: { errors },
        register,
        control,
        getValues
    } = useRemixForm<EntranceTestArrangementFormData>({
        mode: "onSubmit",
        resolver,
        defaultValues: {
            studentIds: initialStudentIds
        },
        fetcher,
        submitConfig: {
            action: '/arrange-entrance-test',
        }
    });

    const isSubmitting = fetcher.state === 'submitting';

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Xếp lịch thi thành công!');
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toast.warning(fetcher.data.error);
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    return <Form method='POST' className='flex flex-col gap-5 my-2'
        onSubmit={handleSubmit}>

        <input type="hidden" {...register('studentIds')} />

        {errors.studentIds && <p className='text-red-500 text-sm'>{errors.studentIds.message}</p>}

        <Controller
            name='date'
            control={control}
            render={({ field: { onChange, onBlur, value, ref } }) => (
                <DateRangePicker
                    value={value}
                    onChange={onChange}
                    className='w-full'
                    placeholder='Chọn ngày cho đợt thi'
                />
            )}
        />

        {errors.date && <p className='text-red-500 text-sm'>{errors.date.message}</p>}

        <Controller
            name='shiftOptions'
            control={control}
            render={({ field: { onChange, onBlur, value, ref } }) => (
                <MultiSelect
                    options={SHIFT_TIME.map((shift, index) => {
                        return { label: `Ca ${index + 1}: ${shift}`, value: index.toString() }
                    })}
                    value={value}
                    onValueChange={onChange}
                    placeholder='Chọn ca thi (nếu cần)'
                />
            )}
        />

        {errors.shiftOptions && <p className='text-red-500 text-sm'>{errors.shiftOptions.message}</p>}

        <Button type='submit' Icon={CalendarSync}
            iconPlacement='left'
            isLoading={isSubmitting}
            disabled={isSubmitting}>
            {isSubmitting ? 'Đang xếp lịch...' : 'Xếp lịch thi'}
        </Button>
    </Form>
}