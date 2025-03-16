import { Form } from '@remix-run/react'
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod'
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator'

type Props = {}

const settingsSchema = z.object({
    maxStudentsPerEntranceTest: z.coerce.number().min(1, { message: 'Số lượng học viên tối đa phải lớn hơn 0' }),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage({ }: Props) {

    const {
        handleSubmit,
        formState: { errors },
        control,
        register
    } = useRemixForm<SettingsFormData>({
        mode: 'onSubmit',
    })

    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">Cấu hình hệ thống</h1>
            <p className='text-muted-foreground'>Quản lý cấu hình hệ thống liên quan đến đào tạo,...</p>

            <Separator className="my-4" />

            <h2 className="text-base font-bold">Cấu hình đào tạo</h2>
            <p className='text-sm text-muted-foreground'>Quản lý cấu hình hệ thống liên quan đến đào tạo</p>

            <Form method='POST' className='my-4' onSubmit={handleSubmit} action='/'>
                <div className="flex flex-row">
                    <Label className='w-[25%] flex items-center'>Số học viên tối đa trong 1 ca thi:</Label>
                    <Input {...register('maxStudentsPerEntranceTest')}
                        placeholder='Nhập số lượng học viên tối đa trong 1 ca thi...'
                        type='number'
                        className='max-w-[50%]' />
                    {errors.maxStudentsPerEntranceTest && <p className='text-red-500'>{errors.maxStudentsPerEntranceTest.message}</p>}

                </div>
                <Button type='submit'>Lưu</Button>
            </Form>

            <Separator className="my-4" />

        </article>
    )
}