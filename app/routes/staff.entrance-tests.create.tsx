import { zodResolver } from '@hookform/resolvers/zod'
import { ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { getValidatedFormData, useRemixForm } from 'remix-hook-form'
import { Button } from '~/components/ui/button'
import { DatePickerInput } from '~/components/ui/date-picker-input'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { CreateEntranceTestFormData, createEntranceTestSchema } from '~/lib/utils/schemas'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Controller } from 'react-hook-form'
import { SHIFT_TIME } from '~/lib/utils/constants'
import { Clock, MapPin, UserCog } from 'lucide-react'
import Combobox from '~/components/ui/combobox'
import RoomsCombobox from '~/components/room/rooms-combobox'

type Props = {}

const rooms = [
    { label: 'Phòng 1', value: '1' },
    { label: 'Phòng 2', value: '2' },
    { label: 'Phòng 3', value: '3' },
];

const instructors = [
    { label: 'Nguyễn Văn A', value: '1' },
    { label: 'Nguyễn Văn B', value: '2' }
];

const resolver = zodResolver(createEntranceTestSchema);

export async function action({ request }: ActionFunctionArgs) {

    const { errors, data, receivedValues: defaultValues } =
        await getValidatedFormData<CreateEntranceTestFormData>(request, resolver);

    if (errors) {
        console.log({ errors });
        // The keys "errors" and "defaultValues" are picked up automatically by useRemixForm
        return { success: false, errors, defaultValues };
    }

    return {
        success: true
    }

}

export default function CreateEntranceTestPage({ }: Props) {

    const {
        handleSubmit,
        formState: { errors, isSubmitting },
        register,
        control
    } = useRemixForm<CreateEntranceTestFormData>({
        mode: "onSubmit",
        resolver
    });

    const actionData = useActionData<typeof action>();

    useEffect(() => {

        if (actionData?.success && actionData.success === true) {
            toast.success('Đợt thi đã được tạo thành công!');
        }
        return () => {

        }

    }, [actionData]);

    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">Tạo mới đợt thi đầu vào</h1>
            <p className="text-muted-foreground">Thông tin cơ bản</p>

            <Form onSubmit={handleSubmit} method='POST' className='my-5 flex flex-col gap-5 md:max-w-[60%]'>

                <div className="">
                    <Label htmlFor='name'>Tên đợt thi</Label>
                    <Input {...register('name')} name='name' id='name' placeholder='Nhập tên đợt thi...' />
                    {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
                </div>

                <div className="flex md:flex-row max-md:flex-col gap-5">
                    <div className="w-full">
                        <Label className='w-full'>Ngày thi</Label>
                        <Controller
                            control={control}
                            name='date'
                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                <DatePickerInput
                                    placeholder='Chọn ngày thi'
                                    ref={ref}
                                    value={value}
                                    onChange={(date) => onChange(date)}
                                    name='date'
                                    id='date'
                                    className='w-full'
                                />
                            )}
                        />
                        {errors.date && <p className='text-sm text-red-500'>{errors.date.message}</p>}
                    </div>
                    <div className="w-full md:max-w-[25%] max-md:max-w-[50%]">
                        <Label className='w-full'>Ca thi</Label>
                        <Controller
                            name='shift'
                            control={control}
                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                <Select onValueChange={onChange} value={value}>
                                    <SelectTrigger className='w-full'>
                                        <SelectValue placeholder={<div className='flex flex-row items-center gap-1'><Clock /> Chọn ca thi</div>} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Ca thi</SelectLabel>
                                            {SHIFT_TIME.map((shift, index) => (
                                                <SelectItem key={shift} value={(index + 1).toString()}>{shift}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.shift && <p className='text-sm text-red-500'>{errors.shift.message}</p>}
                    </div>
                </div>

                <div className="w-full">
                    <Label className='w-full flex flex-row gap-1 items-center'><MapPin className='p-1' />Phòng thi</Label>
                    <Controller
                        name='roomId'
                        control={control}
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <RoomsCombobox value={value} onChange={onChange} />
                        )}
                    />
                    {errors.roomId && <p className='text-sm text-red-500'>{errors.roomId.message}</p>}
                </div>

                <div className="w-full">
                    <Label className='w-full flex flex-row items-center'><UserCog className='p-1' /> Người gác thi</Label>
                    <Controller
                        name='instructorId'
                        control={control}
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <Combobox items={instructors}
                                emptyText='Không tìm thấy người gác thi.'
                                placeholder='Nhập tên người gác thi...'
                                value={value}
                                onChange={onChange}
                                className='w-full' />
                        )}
                    />
                    {errors.instructorId && <p className='text-sm text-red-500'>{errors.instructorId.message}</p>}
                </div>

                <Button variant={'default'} className='uppercase' type='submit'
                    isLoading={isSubmitting} disabled={isSubmitting}>
                    {isSubmitting ? 'Đang tạo' : 'Tạo'}
                </Button>
            </Form>
        </article>
    )
}