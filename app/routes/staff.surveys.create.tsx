import { zodResolver } from '@hookform/resolvers/zod';

import { ActionFunctionArgs } from '@remix-run/node';
import { Form, useFetcher } from '@remix-run/react';
import { CirclePlus, List, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { getValidatedFormData, useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { createQuestionSchema } from '~/components/survey/question-dialog';
import { useQuestionDialog } from '~/components/survey/use-question-dialog';
import { Button } from '~/components/ui/button';
import { DualRangeSlider } from '~/components/ui/dual-range-slider';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';
import { Switch } from '~/components/ui/switch';
import { Textarea } from '~/components/ui/textarea';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {}

const createSchema = z.object({
    name: z.string().nonempty({ message: 'Tên khảo sát không được để trống' }),
    description: z.string().optional(),
    isEmptySurvey: z.boolean().optional(),
    hasAgeConstraint: z.boolean().optional(),
    minAge: z.number().optional(),
    maxAge: z.number().optional(),
    questions: z.array(createQuestionSchema).optional()
});

type CreateSurveyFormData = z.infer<typeof createSchema>;

const resolver = zodResolver(createSchema);

export async function action({ request }: ActionFunctionArgs) {
    try {

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<CreateSurveyFormData>(request, resolver);

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        return {
            success: true
        }

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

export default function CreateSurveyPage({ }: Props) {

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const {
        handleSubmit,
        formState: { errors, isValid },
        control,
        register,
        watch,
        setValue: setFormValue,
        getValues: getFormValues
    }
        = useRemixForm<CreateSurveyFormData>({
            mode: 'onSubmit',
            resolver,
            fetcher,
            defaultValues: {
                isEmptySurvey: false,
                hasAgeConstraint: true,
            }
        });

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận tạo khảo sát',
        description: 'Bạn có chắc chắn muốn tạo khảo sát này?',
        onConfirm: handleSubmit
    });

    const { isOpen: isQuestionDialogOpen, handleOpen: handleOpenQuestionDialog, questionDialog } = useQuestionDialog({
        onQuestionCreated: (questionData) => {
            console.log({ questionData });
            setFormValue('questions', [...(getFormValues().questions || []), questionData]);
        },
        minAge: watch('minAge'),
        maxAge: watch('maxAge')
    });

    const [values, setValues] = useState([0, 100]);

    const isEmptySurvey = watch('isEmptySurvey');

    const questions = watch('questions');

    return (
        <article className='px-10'>
            <h1 className="text-lg font-bold">Tạo khảo sát mới</h1>
            <p className="text-sm text-muted-foreground">
                Tạo khảo sát mới cho trung tâm
            </p>

            <Separator className='w-full my-2' />

            <div className='flex items-center'>
                <div className='px-4 py-2 bg-black text-white font-bold rounded-full'>1</div>
                <div className='p-4 font-bold'>Thông tin chung</div>
            </div>

            <Form method='POST' onSubmit={(e) => {
                if (isValid) {
                    handleOpenConfirmDialog();
                } else {
                    handleSubmit(e);
                }
            }} className='flex flex-col gap-3 my-4'>

                <div className="max-w-[50%]">
                    <Label className='font-bold' htmlFor='name'>Tên khảo sát</Label>
                    <Input {...register('name')} id='name' type='text' placeholder='Nhập tên khảo sát...' />
                    {errors.name && <p className='text-red-500 text-sm'>{errors.name.message}</p>}
                </div>

                <div className="max-w-[50%]">
                    <Label className='font-bold' htmlFor='description'>Mô tả</Label>
                    <Textarea {...register('description')} id='description' placeholder='Nhập mô tả khảo sát...' />
                    {errors.description && <p className='text-red-500 text-sm'>{errors.description.message}</p>}
                </div>

                <Controller
                    control={control}
                    name='hasAgeConstraint'
                    render={({ field: { value, onChange } }) => (
                        <div className="flex items-center space-x-2 my-2">
                            <Switch id="hasAgeConstraint" checked={value} onCheckedChange={onChange} />
                            <Label htmlFor="hasAgeConstraint" className='font-bold'>Giới hạn độ tuổi</Label>
                        </div>
                    )}
                />

                {watch('hasAgeConstraint') && (
                    <>
                        <div className="max-w-[50%] my-5 flex flex-col gap-10">
                            <Label className='font-bold'>Độ tuổi khảo sát</Label>
                            <DualRangeSlider
                                label={(value) => value}
                                value={[watch('minAge') || 0, watch('maxAge') || 100]}
                                onValueChange={(newValues) => {
                                    setFormValue('minAge', newValues[0]);
                                    setFormValue('maxAge', newValues[1]);
                                }}
                                min={0}
                                max={100}
                                step={1}
                            />
                        </div>
                        {errors.minAge && <p className='text-red-500 text-sm'>{errors.minAge.message}</p>}
                        {errors.maxAge && <p className='text-red-500 text-sm'>{errors.maxAge.message}</p>}
                    </>
                )}

                <Controller
                    control={control}
                    name='isEmptySurvey'
                    render={({ field: { value, onChange } }) => (
                        <div className="flex items-center space-x-2 my-2">
                            <Switch id="isEmptySurvey" checked={value} onCheckedChange={onChange} />
                            <Label htmlFor="isEmptySurvey" className='font-bold'>Khảo sát rỗng</Label>
                        </div>
                    )}
                />

                {!isEmptySurvey && (
                    <>
                        {questions?.map((question, index) => (
                            <div className="rounded-md p-2 shadow-lg max-w-[50%] relative" key={index}>
                                <div className="font-bold my-3">
                                    {question.questionContent}
                                </div>

                                <div className="flex flex-col gap-2">
                                    {question.options.map((option, index) => (
                                        <div className="rounded-md border border-gray-300 p-2" key={`${option}_${index}`}>
                                            {option}
                                        </div>
                                    ))}
                                </div>
                                <Button type='button' variant={'outline'} size={'icon'}
                                    className='absolute top-1 right-2 size-8 rounded-full'
                                    onClick={() => {
                                        setFormValue('questions', questions.filter((_, i) => i !== index));
                                    }}>
                                    <Trash2 className='size-6 text-red-600' />
                                </Button>
                            </div>
                        ))}
                        <div className='flex items-center'>
                            <div className='px-4 py-2 bg-black text-white font-bold rounded-full'>2</div>
                            <div className='p-4 font-bold'>Câu hỏi</div>
                        </div>

                        <div className="flex flex-row gap-3">
                            <Button type='button' Icon={CirclePlus} iconPlacement='left' onClick={handleOpenQuestionDialog}>Tạo câu hỏi mới</Button>
                            <Button type='button' variant={'outline'} Icon={List} iconPlacement='left'>Thêm từ ngân hàng câu hỏi</Button>
                        </div>

                        <Separator className='w-full my-2' />
                    </>
                )}


                <Button type='submit' isLoading={isSubmitting} disabled={isSubmitting}
                    className='max-w-[30%] mt-4'>
                    {isSubmitting ? 'Đang tạo...' : 'Tạo khảo sát'}
                </Button>
            </Form>

            {questionDialog}
            {confirmDialog}
        </article>
    );
};