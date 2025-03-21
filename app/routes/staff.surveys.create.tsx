import { zodResolver } from '@hookform/resolvers/zod';
import { ActionFunctionArgs } from '@remix-run/node';
import { Form, useFetcher } from '@remix-run/react';
import { Box, ChevronDown, CirclePlus, GripVertical, Inbox, List, Trash2 } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { getValidatedFormData, useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { CreateQuestionFormData, createQuestionSchema } from '~/components/survey/question-dialog';
import { useQuestionDialog } from '~/hooks/use-question-dialog';
import { Button } from '~/components/ui/button';
import { DualRangeSlider } from '~/components/ui/dual-range-slider';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';
import { Switch } from '~/components/ui/switch';
import { Textarea } from '~/components/ui/textarea';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import useQuestionsListDialog from '~/hooks/use-questions-list-dialog';
import { CSS } from "@dnd-kit/utilities";
import { cn } from '~/lib/utils';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"

import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import React from 'react';

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

    const isEmptySurvey = watch('isEmptySurvey');

    const questions = watch('questions');

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

    const { isOpen: isQuestionsListDialogOpen, handleOpen: handleOpenQuestionsListDialog, questionsListDialog } = useQuestionsListDialog({
        onQuestionsAdded: (questions) => {
            console.log({ questions });

            const questionsFormData = questions.map((question, index) => {
                return {
                    ...question,
                    isRequired: true,
                    minAge: watch('minAge'),
                    maxAge: watch('maxAge'),
                }
            });

            setFormValue('questions', [...(getFormValues().questions || []), ...questionsFormData]);
        }
    });

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
                console.log(getFormValues());
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
                        <div className='flex items-center'>
                            <div className='px-4 py-2 bg-black text-white font-bold rounded-full'>2</div>
                            <div className='p-4 font-bold'>Câu hỏi</div>
                        </div>

                        <Separator className='w-full my-2' />

                        {questions && questions.length > 0 ? (
                            <QuestionsContent questions={questions || []}
                                handleRemoveQuestion={(index) => {
                                    setFormValue('questions', questions.filter((_, i) => i !== index));
                                }}
                                handleRequiredChange={(checked, index) => {
                                    setFormValue('questions', questions.map((q, i) => {
                                        if (i === index) {
                                            return {
                                                ...q,
                                                isRequired: checked
                                            }
                                        }
                                        return q;
                                    }));
                                }}
                                onQuestionsChange={(questions) => {
                                    setFormValue('questions', questions);
                                }} />
                        ) : <div className='flex flex-col items-center max-w-[50%]'>
                            <div className="flex items-center justify-center size-10 rounded-lg border border-border bg-background mb-3">
                                <Inbox className="w-6 h-6 text-foreground" />
                            </div>
                            <p className="font-bold text-foreground">Chưa có câu hỏi nào.</p>
                        </div>}

                        <div className="flex flex-row gap-3 mt-7 items-center justify-center max-w-[50%]">
                            <Button type='button' Icon={CirclePlus} iconPlacement='left' onClick={handleOpenQuestionDialog}>Tạo câu hỏi mới</Button>
                            <Button type='button' variant={'outline'} Icon={List} iconPlacement='left'
                                onClick={handleOpenQuestionsListDialog}>Thêm từ ngân hàng câu hỏi</Button>
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
            {questionsListDialog}
            {confirmDialog}
        </article>
    );
};


function QuestionCard({
    question,
    index,
    handleRemoveQuestion,
    handleRequiredChange
}: {
    question: CreateQuestionFormData,
    index: number;
    handleRemoveQuestion: () => void;
    handleRequiredChange: (checked: boolean) => void;
}) {

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id || index })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return <div ref={setNodeRef} style={style} className={cn("relative mb-4", isDragging && "z-10")}>
        <div className="rounded-md p-2 shadow-lg max-w-[50%] flex flex-row items-center">

            <div
                {...attributes}
                {...listeners}
                className="cursor-grab touch-none flex items-center justify-center p-1 rounded-md hover:bg-muted"
            >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex flex-col w-full">
                <div className="flex justify-between items-center w-full">
                    <div className="font-bold my-3">
                        {index + 1}. {question.questionContent}
                    </div>
                    <Button type='button' variant={'outline'} size={'icon'}
                        className='size-8 rounded-full'
                        onClick={handleRemoveQuestion}>
                        <Trash2 className='size-6 text-red-600' />
                    </Button>
                </div>
                <div className="flex flex-col gap-2">
                    {question.options.map((option, index) => (
                        <div className="rounded-md border border-gray-300 p-2" key={`${option}_${index}`}>
                            {option}
                        </div>
                    ))}
                </div>
                <div className="flex flex-row gap-1 my-2 items-center">
                    <Switch checked={question.isRequired} onCheckedChange={handleRequiredChange}
                        className='data-[state=checked]:bg-red-600' />
                    <Label className='font-bold'>Bắt buộc</Label>
                </div>
            </div>

        </div>
    </div>
}

function QuestionsContent({
    questions,
    onQuestionsChange,
    handleRemoveQuestion,
    handleRequiredChange
}: {
    questions: CreateQuestionFormData[];
    onQuestionsChange: (questions: CreateQuestionFormData[]) => void;
    handleRemoveQuestion: (index: number) => void;
    handleRequiredChange: (checked: boolean, index: number) => void;
}) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handleDragEnd(event: DragEndEvent) {

        const { active, over } = event;

        if (over && active.id !== over.id) {

            const oldIndex = questions.findIndex((item) => item.id === active.id);
            const newIndex = questions.findIndex((item) => item.id === over.id);
            const newQuestions = arrayMove(questions, oldIndex, newIndex);

            onQuestionsChange(newQuestions);
        }
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map((question, index) => question.id || index)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                    {questions.map((question, index) => (
                        <React.Fragment key={question.id || index}>
                            <QuestionCard question={question} handleRemoveQuestion={() => {
                                handleRemoveQuestion(index);
                            }} handleRequiredChange={(checked) => {
                                handleRequiredChange(checked, index);
                            }}
                                index={index} />
                            {index !== questions.length - 1 && <div className="flex justify-center max-w-[50%]">
                                <ChevronDown className="animate-bounce" />
                            </div>}
                        </React.Fragment>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}