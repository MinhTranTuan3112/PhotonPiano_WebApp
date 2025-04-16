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
import { Slider } from "../ui/slider";

export const entranceTestSettingsSchema = z.object({
    minStudentsPerEntranceTest: z.coerce.number().min(1, { message: 'Số lượng học viên tối thiểu phải lớn hơn 0' }),
    maxStudentsPerEntranceTest: z.coerce.number().min(1, { message: 'Số lượng học viên tối đa phải lớn hơn 0' }),
    allowEntranceTestRegistering: z.coerce.boolean(),
    testFee: z.coerce.number().min(0, { message: 'Lệ phí thi phải lớn hơn hoặc bằng 0' }),
    theoryPercentage: z.coerce.number().min(0, { message: 'Tỉ lệ lý thuyết phải lớn hơn hoặc bằng 0' }),
    practicePercentage: z.coerce.number().min(0, { message: 'Tỉ lệ thực hành phải lớn hơn hoặc bằng 0' }),
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
        register,
        setValue: setFormValue,
        watch
    } = useRemixForm<EntranceTestSettingsFormData & { module: string }>({
        mode: 'onSubmit',
        resolver: zodResolver(entranceTestSettingsSchema.extend({
            module: z.string()
        })),
        defaultValues: {
            module: 'entrance-tests',
            ...defaultData,
            theoryPercentage: defaultData.theoryPercentage || 50,
            practicePercentage: defaultData.practicePercentage || 50
        },
        submitConfig: {
            action: '/admin/settings',
            method: "POST"
        },
        fetcher
    });

    const theoryPercentage = watch('theoryPercentage');

    const practicePercentage = watch('practicePercentage');

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

                <div className="flex flex-row max-w-[30%]">
                    <Label className='w-[30%] flex items-center'>Lệ phí thi: </Label>
                    <Input {...register('testFee')}
                        placeholder='Nhập lệ phí thi...'
                        type='number' />
                    <div className="flex items-center ml-1">đ</div>
                </div>
                {errors.testFee && <p className='text-red-500 text-sm'>{errors.testFee.message}</p>}

                <div className="max-w-[50%]">
                    <h1 className="text-base font-bold">Tỉ trọng điểm thi:</h1>
                    <br />
                    <div className="flex justify-between mb-2">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{theoryPercentage}%</div>
                            <div className="text-sm text-muted-foreground">Lý thuyết</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{100 - theoryPercentage}%</div>
                            <div className="text-sm text-muted-foreground">Thực hành</div>
                        </div>
                    </div>
                    <Slider value={[theoryPercentage]} max={100} step={1} onValueChange={(value) => {
                        setFormValue('theoryPercentage', value[0]);
                        setFormValue('practicePercentage', 100 - value[0]);
                    }}/>
                </div>

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