import { zodResolver } from '@hookform/resolvers/zod';
import { FetcherWithComponents, Form } from '@remix-run/react';
import { ChevronDown, CirclePlus, GripVertical, Inbox, List, Trash2 } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
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

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export const surveySchema = z.object({
    id: z.string().optional(),
    name: z.string().nonempty({ message: 'Survey name is required' }),
    description: z.string().optional(),
    isEmptySurvey: z.boolean().optional(),
    isEntranceSurvey: z.boolean().optional(),
    hasAgeConstraint: z.boolean().optional(),
    minAge: z.coerce.number().optional(),
    maxAge: z.coerce.number().optional(),
    questions: z.array(createQuestionSchema).optional()
});

export type SurveyFormData = z.infer<typeof surveySchema>;

export const surveyResolver = zodResolver(surveySchema);

type Props = {
    idToken: string;
    fetcher: FetcherWithComponents<any>;
    surveyData?: SurveyFormData;
    isEditing?: boolean;
}

export default function SurveyForm({ idToken, fetcher, surveyData, isEditing = false }: Props) {

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
        = useRemixForm<SurveyFormData>({
            mode: 'onSubmit',
            resolver: surveyResolver,
            fetcher,
            defaultValues: {
                ...surveyData,
                isEmptySurvey: false,
                isEntranceSurvey: surveyData?.isEntranceSurvey ? surveyData.isEntranceSurvey : false,
                hasAgeConstraint: true,
            }
        });

    const isEmptySurvey = watch('isEmptySurvey');

    const questions = watch('questions');

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: isEditing ? 'Confirm updating survey information' : 'Confirm creating survey',
        description: isEditing ? 'Update this survey?' : 'Create this survey?',
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
        idToken,
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
        <>
            <div className='flex items-center'>
                <div className='px-4 py-2 bg-black text-white font-bold rounded-full'>1</div>
                <div className='p-4 font-bold'>General information</div>
            </div>

            <Form method='POST' onSubmit={() => {
                console.log(getFormValues());
                handleOpenConfirmDialog();
            }} className='flex flex-col gap-3 my-4'>

                <div className="max-w-[50%]">
                    <Label className='font-bold' htmlFor='name'>Name</Label>
                    <Input {...register('name')} id='name' type='text' placeholder='Enter survey name...' />
                    {errors.name && <p className='text-red-500 text-sm'>{errors.name.message}</p>}
                </div>

                <div className="max-w-[50%]">
                    <Label className='font-bold' htmlFor='description'>Description</Label>
                    <Textarea {...register('description')} id='description' placeholder='Enter survey description...' />
                    {errors.description && <p className='text-red-500 text-sm'>{errors.description.message}</p>}
                </div>

                <Controller
                    control={control}
                    name='hasAgeConstraint'
                    render={({ field: { value, onChange } }) => (
                        <div className="flex items-center space-x-2 my-2">
                            <Switch id="hasAgeConstraint" checked={value} onCheckedChange={onChange} />
                            <Label htmlFor="hasAgeConstraint" className='font-bold'>Age constraint</Label>
                        </div>
                    )}
                />

                {watch('hasAgeConstraint') && (
                    <>
                        <div className="max-w-[50%] my-5 flex flex-col gap-10">
                            <Label className='font-bold'>Survey age constraint</Label>
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
                            <Label htmlFor="isEmptySurvey" className='font-bold'>Is empty survey</Label>
                        </div>
                    )}
                />

                {isEditing && <Controller
                    control={control}
                    name='isEntranceSurvey'
                    render={({ field: { value, onChange } }) => (
                        <div className="flex items-center space-x-2 my-2">
                            <Switch id="isEntranceSurvey" checked={value} onCheckedChange={onChange} />
                            <Label htmlFor="isEntranceSurvey" className='font-bold'>
                                Is current entrance survey
                            </Label>
                        </div>
                    )}
                />}

                {!isEmptySurvey && (
                    <>
                        <div className='flex items-center'>
                            <div className='px-4 py-2 bg-black text-white font-bold rounded-full'>2</div>
                            <div className='p-4 font-bold'>Questions</div>
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
                                handleQuestionContentChange={(content, index) => {
                                    setFormValue('questions', questions.map((q, i) => {
                                        if (i === index) {
                                            return {
                                                ...q,
                                                questionContent: content
                                            }
                                        }
                                        return q;
                                    }));
                                }}
                                handleQuestionOptionsChange={(options, index) => (
                                    setFormValue('questions', questions.map((q, i) => {
                                        if (i === index) {
                                            return {
                                                ...q,
                                                options: options
                                            }
                                        }
                                        return q;
                                    }))
                                )}

                                onQuestionsChange={(questions) => {
                                    setFormValue('questions', questions);
                                }}

                                handleAllowOtherOptionsChange={(checked, index) => (
                                    setFormValue('questions', questions.map((q, i) => {
                                        if (i === index) {
                                            return {
                                                ...q,
                                                allowOtherAnswer: checked
                                            }
                                        }
                                        return q;
                                    }))
                                )}
                            />
                        ) : <div className='flex flex-col items-center max-w-[50%]'>
                            <div className="flex items-center justify-center size-10 rounded-lg border border-border bg-background mb-3">
                                <Inbox className="w-6 h-6 text-foreground" />
                            </div>
                            <p className="font-bold text-foreground">No questions found.</p>
                        </div>}

                        <div className="flex flex-row gap-3 mt-7 items-center justify-center max-w-[50%]">
                            <Button type='button' Icon={CirclePlus} iconPlacement='left' onClick={handleOpenQuestionDialog}>Create new question</Button>
                            <Button type='button' variant={'outline'} Icon={List} iconPlacement='left'
                                onClick={handleOpenQuestionsListDialog}>Add from question bank</Button>
                        </div>

                        <Separator className='w-full my-2' />
                    </>
                )}

                <Button type='button' isLoading={isSubmitting} disabled={isSubmitting}
                    className='max-w-[30%] mt-4' onClick={handleOpenConfirmDialog}>
                    {isEditing ? 'Update' : 'Create'}
                </Button>
            </Form>

            {questionDialog}
            {questionsListDialog}
            {confirmDialog}
        </>
    );
};


function QuestionCard({
    question,
    index,
    handleRemoveQuestion,
    handleRequiredChange,
    handleQuestionContentChange,
    handleQuestionOptionsChange,
    handleAllowOtherOptionsChange
}: {
    question: CreateQuestionFormData
    index: number
    handleRemoveQuestion: () => void
    handleRequiredChange: (checked: boolean) => void
    handleQuestionContentChange: (content: string) => void
    handleQuestionOptionsChange: (options: string[]) => void
    handleAllowOtherOptionsChange: (checked: boolean) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: question.id || index,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const [newOption, setNewOption] = useState("")

    // Track local option values for editing
    const [localOptions, setLocalOptions] = useState<Record<number, string>>({})

    // Initialize local options from question.options
    useEffect(() => {
        const initialLocalOptions: Record<number, string> = {}
        question.options?.forEach((option, idx) => {
            initialLocalOptions[idx] = option
        })
        setLocalOptions(initialLocalOptions)
    }, [question.id]) // Only reset when question ID changes

    // Handle option input change without immediate parent sync
    const handleOptionChange = useCallback((value: string, optionIndex: number) => {
        setLocalOptions((prev) => ({
            ...prev,
            [optionIndex]: value,
        }))
    }, [])

    // Sync a specific option with parent
    const syncOption = useCallback(
        (optionIndex: number) => {
            const newOptions = [...(question.options || [])]
            newOptions[optionIndex] = localOptions[optionIndex]
            handleQuestionOptionsChange(newOptions)
        },
        [question.options, localOptions, handleQuestionOptionsChange],
    )

    // Handle option removal
    const handleRemoveOption = useCallback(
        (optionIndex: number) => {
            // Update local state
            const newLocalOptions = { ...localOptions }
            delete newLocalOptions[optionIndex]

            // Reindex remaining options
            const reindexedOptions: Record<number, string> = {}
            let newIndex = 0
            Object.keys(newLocalOptions).forEach((key) => {
                const idx = Number.parseInt(key)
                if (idx < optionIndex) {
                    reindexedOptions[newIndex] = newLocalOptions[idx]
                    newIndex++
                } else if (idx > optionIndex) {
                    reindexedOptions[newIndex] = newLocalOptions[idx]
                    newIndex++
                }
            })

            setLocalOptions(reindexedOptions)

            // Update parent
            const newOptions = (question.options || []).filter((_, i) => i !== optionIndex)
            handleQuestionOptionsChange(newOptions)
        },
        [localOptions, question.options, handleQuestionOptionsChange],
    )

    // Add new option
    const handleAddOption = useCallback(() => {
        if (!newOption || newOption.trim() === "") {
            toast.warning("Option can't be empty!", {
                duration: 5000
            })
            return
        }

        // Update parent
        const updatedOptions = [...(question.options || []), newOption]
        handleQuestionOptionsChange(updatedOptions)

        // Update local state
        setLocalOptions((prev) => ({
            ...prev,
            [updatedOptions.length - 1]: newOption,
        }))

        setNewOption("")
    }, [newOption, question.options, handleQuestionOptionsChange])

    // Handle Enter key press to add new option
    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault()
                handleAddOption()
            }
        },
        [handleAddOption],
    )

    return (
        <div ref={setNodeRef} style={style} className={cn("relative mb-4", isDragging && "z-10")}>
            <div className="rounded-md p-2 shadow-lg max-w-[50%] flex flex-row items-center">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab touch-none flex items-center justify-center p-1 rounded-md hover:bg-muted"
                >
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex flex-col w-full">
                    <div className="flex justify-between items-center w-full gap-3">
                        <div className="font-bold my-3 flex flex-row items-center gap-1 w-full">
                            <div className="">{index + 1}. </div>
                            <Input
                                placeholder="Enter question"
                                value={question.questionContent}
                                onChange={(e) => {
                                    const newContent = e.target.value

                                    if (!newContent || newContent.trim() === "") {
                                        toast.warning("Question content cannot be empty!", {
                                            duration: 5000
                                        })
                                        return
                                    }

                                    handleQuestionContentChange(newContent)
                                }}
                            />
                        </div>
                        <Button
                            type="button"
                            variant={"outline"}
                            size={"icon"}
                            className="size-8 rounded-full"
                            onClick={handleRemoveQuestion}
                        >
                            <Trash2 className="size-6 text-red-600" />
                        </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {question.options?.map((option, optionIndex) => (
                            <div className="flex flex-row gap-2 items-center" key={`option_${optionIndex}`}>
                                <Input
                                    placeholder="Enter option..."
                                    value={localOptions[optionIndex] !== undefined ? localOptions[optionIndex] : option}
                                    onChange={(e) => handleOptionChange(e.target.value, optionIndex)}
                                    onBlur={() => syncOption(optionIndex)}
                                />

                                <Button type="button" size={"icon"} onClick={() => handleRemoveOption(optionIndex)} variant={"outline"}>
                                    <Trash2 className="text-red-600" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-row gap-2 items-center justify-center my-2">
                        <Input
                            placeholder="Enter new options..."
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            onKeyDown={handleKeyPress}
                        />

                        <Button type="button" variant={"outline"} size={"icon"} onClick={handleAddOption}>
                            <CirclePlus />
                        </Button>
                    </div>

                    <div className="flex flex-row gap-1 my-2 items-center">
                        <Switch
                            checked={question.isRequired}
                            onCheckedChange={handleRequiredChange}
                            className="data-[state=checked]:bg-red-600"
                        />
                        <Label className="font-bold">Required</Label>
                    </div>

                    <div className="flex flex-row gap-1 my-3 items-center">
                        <Switch
                            checked={question.allowOtherAnswer}
                            onCheckedChange={handleAllowOtherOptionsChange}
                            className=""
                        />
                        <Label className="font-bold">Allow other answers</Label>
                    </div>
                </div>
            </div>
        </div>
    )
}

function QuestionsContent({
    questions,
    onQuestionsChange,
    handleRemoveQuestion,
    handleRequiredChange,
    handleQuestionContentChange,
    handleQuestionOptionsChange,
    handleAllowOtherOptionsChange,
}: {
    questions: CreateQuestionFormData[];
    onQuestionsChange: (questions: CreateQuestionFormData[]) => void;
    handleRemoveQuestion: (index: number) => void;
    handleRequiredChange: (checked: boolean, index: number) => void;
    handleQuestionContentChange: (content: string, index: number) => void;
    handleQuestionOptionsChange: (options: string[], index: number) => void;
    handleAllowOtherOptionsChange: (checked: boolean, index: number) => void;
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
                                handleQuestionContentChange={(content) => {
                                    handleQuestionContentChange(content, index);
                                }}

                                handleQuestionOptionsChange={(options) => {
                                    handleQuestionOptionsChange(options, index);
                                }}
                                handleAllowOtherOptionsChange={(checked) => (
                                    handleAllowOtherOptionsChange(checked, index)
                                )}
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