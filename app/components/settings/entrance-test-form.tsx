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
    minStudentsPerEntranceTest: z.coerce.number().min(1, { message: 'Min learners in test must > 0' }),
    maxStudentsPerEntranceTest: z.coerce.number().min(1, { message: 'Max learners in test must > 0' }),
    allowEntranceTestRegistering: z.coerce.boolean(),
    testFee: z.coerce.number().min(0, { message: 'Test fee must > 0' }),
    theoryPercentage: z.coerce.number().min(0, { message: 'Theory weight must > 0' }),
    practicePercentage: z.coerce.number().min(0, { message: 'Practical weight must > 0' }),
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
        title: 'Confirm action',
        description: 'Save this config?',
        onConfirm: handleSubmit,
    });

    return (
        <>
            <h2 className="text-base font-bold">Entrance tests system config</h2>
            <p className='text-sm text-muted-foreground'>
                Entrance tests system config allows you to configure the entrance test system. 
            </p>
            <Form method='POST' className='my-4 flex flex-col gap-4'>

                <div className="flex flex-row">
                    <Label className='w-[23%] flex items-center'>Allow entrance test registering:</Label>
                    <Controller
                        control={control}
                        name='allowEntranceTestRegistering'
                        render={({ field: { value, onChange } }) => (
                            <Switch checked={value} onCheckedChange={onChange} className="data-[state=checked]:bg-theme"/>
                        )}
                    />
                </div>
                {errors.allowEntranceTestRegistering && <p className='text-red-500 text-sm'>{errors.allowEntranceTestRegistering.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[30%] flex items-center'>Min learners in test:</Label>
                    <Input {...register('minStudentsPerEntranceTest')}
                        placeholder='Enter min learners in test...'
                        type='number'
                        className='max-w-[10%]' />
                </div>
                {errors.minStudentsPerEntranceTest && <p className='text-red-500 text-sm'>{errors.minStudentsPerEntranceTest.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[30%] flex items-center'>Max learners in test:</Label>
                    <Input {...register('maxStudentsPerEntranceTest')}
                        placeholder='Enter max learners in test...'
                        type='number'
                        className='max-w-[10%]' />
                </div>
                {errors.maxStudentsPerEntranceTest && <p className='text-red-500 text-sm'>{errors.maxStudentsPerEntranceTest.message}</p>}

                <div className="flex flex-row max-w-[30%]">
                    <Label className='w-[30%] flex items-center'>Test fee: </Label>
                    <Input {...register('testFee')}
                        placeholder='Enter test fee...'
                        type='number' />
                    <div className="flex items-center ml-1">đ</div>
                </div>
                {errors.testFee && <p className='text-red-500 text-sm'>{errors.testFee.message}</p>}

                <div className="max-w-[50%]">
                    <h1 className="text-base font-bold">Score weight rate:</h1>
                    <br />
                    <div className="flex justify-between mb-2">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{theoryPercentage}%</div>
                            <div className="text-sm text-muted-foreground">Theoretical</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{100 - theoryPercentage}%</div>
                            <div className="text-sm text-muted-foreground">Practical</div>
                        </div>
                    </div>
                    <Slider value={[theoryPercentage]} max={100} step={1} onValueChange={(value) => {
                        setFormValue('theoryPercentage', value[0]);
                        setFormValue('practicePercentage', 100 - value[0]);
                    }}/>
                </div>

                <div className="my-4">
                    <Button type='button' isLoading={isSubmitting} disabled={isSubmitting}
                        onClick={handleOpenConfirmDialog} variant={'theme'} className="w-full max-w-[30%]">
                        {isSubmitting ? 'Save...' : 'Save'}
                    </Button>
                </div>
            </Form>
            {confirmDialog}
        </>
    );
};