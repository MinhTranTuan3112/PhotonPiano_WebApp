import { Form } from '@remix-run/react';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { z } from 'zod';
import { useRemixForm } from 'remix-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller } from 'react-hook-form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';
import { QUESTION_TYPES } from '~/lib/utils/constants';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { CirclePlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { QuestionType } from '~/lib/types/survey-question/survey-question';
import { DualRangeSlider } from '../ui/dual-range-slider';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';

export type QuestionDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onQuestionCreated: (questionData: CreateQuestionFormData) => void;
    isEditing?: boolean;
    requiresUpload?: boolean;
    requiresAgeInputs?: boolean;
} & Partial<CreateQuestionFormData>;

export const createQuestionSchema = z.object({
    id: z.string().optional(),
    type: z.coerce.number({ message: 'Vui lòng chọn loại câu hỏi.' }),
    questionContent: z.string({ message: 'Nội dung câu hỏi không được để trống.' }).nonempty({ message: 'Nội dung câu hỏi không được để trống.' }),
    options: z.array(z.string()).optional(),
    allowOtherAnswer: z.boolean().optional(),
    isRequired: z.boolean().optional(),
    hasAgeConstraint: z.boolean().optional(),
    minAge: z.coerce.number().optional(),
    maxAge: z.coerce.number().optional(),
    questionAction: z.string().optional(),
}).refine((data) => {
    if ([QuestionType.MultipleChoice, QuestionType.SingleChoice, QuestionType.LikertScale].includes(data.type)) {
        return Array.isArray(data.options) && data.options.length > 0;
    }
    return true;
}, {
    message: 'Các tùy chọn là bắt buộc đối với câu hỏi lựa chọn đơn, lựa chọn nhiều hoặc thang đo đánh giá.',
    path: ['options']
});

export type CreateQuestionFormData = z.infer<typeof createQuestionSchema>;

const resolver = zodResolver(createQuestionSchema);

export default function QuestionDialog({
    isOpen,
    setIsOpen,
    onQuestionCreated,
    isEditing = false,
    requiresAgeInputs = false,
    requiresUpload = false,
    ...defaultData
}: QuestionDialogProps) {

    const { handleSubmit,
        formState: { errors, isValid },
        control,
        register,
        watch,
        setValue: setFormValue,
        getValues: getFormValues,
        trigger,
        reset
    } = useRemixForm<CreateQuestionFormData>({
        mode: 'onSubmit',
        resolver,
        submitConfig: {
            action: '/staff/survey-questions',
        },
        defaultValues: {
            ...defaultData,
            hasAgeConstraint: defaultData.hasAgeConstraint ? defaultData.hasAgeConstraint : false,
            questionAction: isEditing ? 'update' : 'create',
            type: defaultData?.type || QuestionType.MultipleChoice,
            allowOtherAnswer: false,
            isRequired: true,
        }
    });

    const type = getFormValues().type;

    const options = watch('options');

    const [newOption, setNewOption] = useState('');

    const addOption = () => {
        if (newOption.trim() !== '') {
            const oldOptions = options || [];
            setFormValue('options', [...oldOptions, newOption]);
            setNewOption('');
        }
    }

    const removeOption = (index: number) => {
        const oldOptions = options || [];
        setFormValue('options', oldOptions.filter((_, i) => i !== index));
    }

    // Handle Enter key press for the option input
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            addOption();
        }
    }

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: isEditing ? 'Cập nhật câu hỏi?' : 'Thêm câu hỏi mới?',
        description: isEditing ? 'Bạn có chắc chắn muốn cập nhật câu hỏi này?' : 'Bạn có chắc chắn muốn thêm câu hỏi mới?',
        onConfirm: () => {
            handleSubmit();
            onQuestionCreated(getFormValues());
            setIsOpen(false);
            reset();
            setNewOption('');
            toast.success('Thêm thành công!', {
                position: 'top-center',
                duration: 1250
            });
        },
        confirmText: isEditing ? 'Cập nhật' : 'Thêm'    
    });

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => {
                reset();
                setIsOpen(open);
            }}>
                <DialogContent className="">
                    <DialogHeader>
                        <DialogTitle>Thêm câu hỏi mới</DialogTitle>
                        <DialogDescription>
                            Câu hỏi được tạo sẽ tự động được thêm vào ngân hàng câu hỏi.
                        </DialogDescription>
                    </DialogHeader>
                    <Form method='POST' onSubmit={(e) => {
                        if (!requiresUpload) {
                            e.preventDefault();
                            return;
                        }
                        // handleOpenConfirmDialog();

                    }} className='flex flex-col gap-3'>
                        <div className="">
                            <Label className='font-bold'>Loại câu hỏi</Label>
                            <Controller
                                control={control}
                                name="type"
                                render={({ field: { value, onChange } }) => (
                                    <Select value={value.toString()} onValueChange={onChange}>
                                        <SelectTrigger className="">
                                            <SelectValue placeholder="Chọn loại câu hỏi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Loại câu hỏi</SelectLabel>
                                                {QUESTION_TYPES.map((type, index) => (
                                                    <SelectItem key={index} value={index.toString()}>{type}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
                        </div>
                        <div className="">
                            <Label htmlFor='questionContent' className='font-bold'>Nội dung câu hỏi</Label>
                            <Textarea {...register('questionContent')} id='questionContent' placeholder='Nhập nội dung câu hỏi...' />
                            {errors.questionContent && <p className="text-red-500 text-sm">{errors.questionContent.message}</p>}
                        </div>

                        <div className="">
                            <Label className='font-bold'>Các lựa chọn</Label>
                            <div className="flex flex-col gap-2 mb-2">
                                {options?.map((option, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <Input value={option} readOnly />
                                        <Button type='button' variant={'outline'} size={'icon'} onClick={() => removeOption(index)}>
                                            <Trash2 className='text-red-600' />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-row gap-3">
                                <Input value={newOption} onChange={(e) => {
                                    setNewOption(prev => e.target.value);
                                }} placeholder='Thêm lựa chọn mới...' onKeyDown={handleKeyDown} />
                                <Button type='button' variant={'outline'} size={'icon'}
                                    onClick={addOption} disabled={newOption.trim() === ''}>
                                    <CirclePlus />
                                </Button>
                            </div>
                        </div>
                        {errors.options && <p className="text-red-500 text-sm">{errors.options.message}</p>}

                        <div className="flex flex-col gap-3 my-3">

                            {!requiresUpload && <Controller
                                control={control}
                                name='isRequired'
                                render={({ field: { value, onChange } }) => (
                                    <div className="flex items-center space-x-2">
                                        <Switch className='data-[state=checked]:bg-red-600' id="isRequired" checked={value} onCheckedChange={onChange} />
                                        <Label htmlFor="isRequired">Bắt buộc</Label>
                                    </div>
                                )}
                            />}

                            <Controller
                                control={control}
                                name='allowOtherAnswer'
                                render={({ field: { value, onChange } }) => (
                                    <div className="flex items-center space-x-2">
                                        <Switch id="allowOtherAnswer" checked={value} onCheckedChange={onChange} />
                                        <Label htmlFor="allowOtherAnswer">Cho phép câu trả lời khác</Label>
                                    </div>
                                )}
                            />
                        </div>

                        {requiresAgeInputs && (
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
                        )}

                        {requiresAgeInputs && watch('hasAgeConstraint') && (
                            <>
                                <div className="my-5 flex flex-col gap-10">
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



                        <DialogFooter>
                            <Button type={'button'} onClick={() => {

                                if (requiresUpload === false) {
                                    if (!isValid) {
                                        trigger();
                                    } else {
                                        onQuestionCreated(getFormValues());
                                        setIsOpen(false);
                                        reset();
                                        setNewOption('');
                                        toast.success('Thêm thành công!', {
                                            position: 'top-center',
                                            duration: 1250
                                        });
                                    }
                                    console.log({ errors });
                                } else {
                                    handleOpenConfirmDialog();
                                }
                                // // Add this code to include any pending option before submission
                                // if (newOption.trim() !== '') {
                                //     const oldOptions = options || [];
                                //     setFormValue('options', [...oldOptions, newOption]);
                                //     // No need to reset newOption here as we're about to close the dialog
                                // }

                                // Then continue with your existing logic
                            }}>
                                {!requiresUpload ? 'Hoàn tất' : isEditing ? 'Cập nhật' : 'Thêm'}
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>
            {confirmDialog}
        </>
    )
}