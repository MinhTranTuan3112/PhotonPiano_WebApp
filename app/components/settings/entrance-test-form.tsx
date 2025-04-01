import { FetcherWithComponents, Form } from "@remix-run/react";
import { useRemixForm } from "remix-hook-form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { Controller } from "react-hook-form";
import { Switch } from "../ui/switch";

export const entranceTestSettingsSchema = z.object({
    minStudentsPerEntranceTest: z.coerce.number().min(1, { message: 'Số lượng học viên tối thiểu phải lớn hơn 0' }),
    maxStudentsPerEntranceTest: z.coerce.number().min(1, { message: 'Số lượng học viên tối đa phải lớn hơn 0' }),
    allowEntranceTestRegistering: z.coerce.boolean(),
});

export type EntranceTestSettingsFormData = z.infer<typeof entranceTestSettingsSchema>;

type Props = {
    fetcher: FetcherWithComponents<any>;
    isSubmitting: boolean;
} & Partial<EntranceTestSettingsFormData>;

export default function EntranceTestConfigForm({
    fetcher, isSubmitting, ...defaultData
}: Props) {

    const { handleSubmit,
        formState: { errors },
        control,
        register
    } = useRemixForm<EntranceTestSettingsFormData & { module: string }>({
        mode: 'onSubmit',
        resolver: zodResolver(entranceTestSettingsSchema.extend({
            module: z.string()
        })),
        defaultValues: {
            module: 'entrance-tests',
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
            <h2 className="text-base font-bold">Cấu hình thi đầu vào</h2>
            <p className='text-sm text-muted-foreground'>Quản lý cấu hình hệ thống liên quan đến thi đầu vào</p>
            <Form method='POST' className='my-4 flex flex-col gap-4'>

                <div className="flex flex-row">
                    <Label className='w-[23%] flex items-center'>Cho phép đăng ký thi đầu vào:</Label>
                    <Controller
                        control={control}
                        name='allowEntranceTestRegistering'
                        render={({ field: { value, onChange } }) => (
                            <Switch checked={value} onCheckedChange={onChange} />
                        )}
                    />
                </div>
                {errors.allowEntranceTestRegistering && <p className='text-red-500 text-sm'>{errors.allowEntranceTestRegistering.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[30%] flex items-center'>Số học viên tối thiểu trong 1 ca thi:</Label>
                    <Input {...register('minStudentsPerEntranceTest')}
                        placeholder='Nhập số lượng học viên tối thiểu trong 1 ca thi...'
                        type='number'
                        className='max-w-[10%]' />
                </div>
                {errors.minStudentsPerEntranceTest && <p className='text-red-500 text-sm'>{errors.minStudentsPerEntranceTest.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[30%] flex items-center'>Số học viên tối đa trong 1 ca thi:</Label>
                    <Input {...register('maxStudentsPerEntranceTest')}
                        placeholder='Nhập số lượng học viên tối đa trong 1 ca thi...'
                        type='number'
                        className='max-w-[10%]' />
                </div>
                {errors.maxStudentsPerEntranceTest && <p className='text-red-500 text-sm'>{errors.maxStudentsPerEntranceTest.message}</p>}

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
};