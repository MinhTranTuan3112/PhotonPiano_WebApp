import { LoaderFunctionArgs } from '@remix-run/node';
import { Await, Form, redirect, useLoaderData } from '@remix-run/react'
import { Suspense } from 'react';
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod'
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton';
import { Switch } from '~/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Toggle } from '~/components/ui/toggle';
import { fetchSystemConfigs } from '~/lib/services/system-config';
import { SystemConfig } from '~/lib/types/config/system-config';
import { requireAuth } from '~/lib/utils/auth';
import { ALLOW_SKIPPING_LEVEL, MAX_STUDENTS, MAX_STUDENTS_IN_EXAM, MIN_STUDENTS } from '~/lib/utils/config-name';

type Props = {}

export async function loader({ params, request }: LoaderFunctionArgs) {

    const { idToken, role } = await requireAuth(request);

    if (role !== 3) {
        return redirect('/');
    }

    const { searchParams } = new URL(request.url);

    const promise = fetchSystemConfigs({ idToken }).then((res) => {
        return res.data as SystemConfig[]
    });


    return {
        promise, idToken
    }
}

const settingsSchema = z.object({
    maxStudentsPerEntranceTest: z.coerce.number().min(1, { message: 'Số lượng học viên tối đa phải lớn hơn 0' }),
});
const classSettingsSchema = z.object({
    maxStudents: z.coerce.number().min(1, { message: 'Số lượng học viên tối đa phải lớn hơn 0' }),
    minStudents: z.coerce.number().min(1, { message: 'Số lượng học viên tối thiểu phải lớn hơn 0' }),
    allowSkippingLevel: z.boolean().default(false),
});

type SettingsFormData = z.infer<typeof settingsSchema>;
type ClassSettingsFormData = z.infer<typeof classSettingsSchema>;

export default function AdminSettingsPage({ }: Props) {
    const { promise, idToken } = useLoaderData<typeof loader>()

    const {
        handleSubmit,
        formState: { errors },
        control,
        register
    } = useRemixForm<SettingsFormData>({
        mode: 'onSubmit',
    })

    const {
        handleSubmit: handleClassSubmit,
        formState: { errors: classErrors },
        control: classControl,
        register: classRegister
    } = useRemixForm<ClassSettingsFormData>({
        mode: 'onSubmit',
    })

    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">Cấu hình hệ thống</h1>
            <p className='text-muted-foreground'>Quản lý cấu hình hệ thống liên quan đến đào tạo,...</p>

            <Separator className="my-4" />

            <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise} >
                    {(configs) => (
                        <Tabs defaultValue='entrance-test'>
                            <TabsList className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-4">
                                <TabsTrigger value="entrance-test">
                                    Thi đầu vào
                                </TabsTrigger>
                                <TabsTrigger value="classes">
                                    Quản lý lớp
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="entrance-test">
                                <h2 className="text-base font-bold">Cấu hình thi đầu vào</h2>
                                <p className='text-sm text-muted-foreground'>Quản lý cấu hình hệ thống liên quan đến thi đầu vào</p>

                                <Form method='POST' className='my-4' onSubmit={handleSubmit} action='/'>
                                    <div className="flex flex-row">
                                        <Label className='w-[25%] flex items-center'>Số học viên tối đa trong 1 ca thi:</Label>
                                        <Input {...register('maxStudentsPerEntranceTest')}
                                            defaultValue={configs.find(c => c.configName === MAX_STUDENTS_IN_EXAM)?.configValue}
                                            placeholder='Nhập số lượng học viên tối đa trong 1 ca thi...'
                                            type='number'
                                            className='max-w-[50%]' />
                                        {errors.maxStudentsPerEntranceTest && <p className='text-red-500'>{errors.maxStudentsPerEntranceTest.message}</p>}

                                    </div>
                                    <Button type='submit'>Lưu</Button>
                                </Form>
                            </TabsContent>
                            <TabsContent value="classes">
                                <h2 className="text-base font-bold">Cấu hình lớp</h2>
                                <p className='text-sm text-muted-foreground'>Quản lý cấu hình hệ thống liên quan đến xếp lớp và quản lý lớp</p>

                                <Form method='POST' className='my-4' onSubmit={handleClassSubmit} action='/'>
                                    <div>
                                        <div className="flex flex-row mb-4 gap-2">
                                            <Label className='w-1/2 lg:w-1/4 flex items-center'>Sĩ số tối đa cho 1 lớp:</Label>
                                            <Input {...classRegister('maxStudents')}
                                                defaultValue={configs.find(c => c.configName === MAX_STUDENTS)?.configValue}
                                                placeholder='Nhập giá trị...'
                                                type='number'
                                                className='w-36' />
                                            {classErrors.maxStudents && <p className='text-red-500'>{classErrors.maxStudents.message}</p>}
                                        </div>
                                        <div className="flex flex-row mb-4 gap-2">
                                            <Label className='w-1/2 lg:w-1/4 flex items-center'>Sĩ số tối thiểu để mở lớp:</Label>
                                            <Input {...classRegister('minStudents')}
                                                defaultValue={configs.find(c => c.configName === MIN_STUDENTS)?.configValue}
                                                placeholder='Nhập giá trị...'
                                                type='number'
                                                className='w-36' />
                                            {classErrors.minStudents && <p className='text-red-500'>{classErrors.minStudents.message}</p>}
                                        </div>
                                        <div className="flex flex-row mb-4 gap-2">
                                            <Label className='w-1/2 lg:w-1/4 flex items-center'>Được phép học vượt Level:</Label>
                                            <Controller
                                                control={classControl}
                                                name='allowSkippingLevel'
                                                defaultValue={configs.find(c => c.configName === ALLOW_SKIPPING_LEVEL)?.configValue === "true"}
                                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                                    <div>
                                                        <Switch checked={value} onCheckedChange={onChange}
                                                            className='m-0' />
                                                    </div>
                                                )}
                                            />
                                            {classErrors.allowSkippingLevel && <p className='text-red-500'>{classErrors.allowSkippingLevel.message}</p>}
                                        </div>
                                    </div>

                                    <Button type='submit'>Lưu</Button>
                                </Form>
                            </TabsContent>
                        </Tabs>
                    )}
                </Await>

            </Suspense>



            <Separator className="my-4" />

        </article>
    )
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}