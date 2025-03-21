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

export type QuestionDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onQuestionCreated: (questionData: CreateQuestionFormData) => void;
} & Partial<CreateQuestionFormData>;

export const createQuestionSchema = z.object({
    id: z.string().optional(),
    type: z.coerce.number({ message: 'Vui lòng chọn loại câu hỏi.' }),
    questionContent: z.string({ message: 'Nội dung câu hỏi không được để trống.' }).nonempty({ message: 'Nội dung câu hỏi không được để trống.' }),
    options: z.array(z.string()),
    // orderIndex: z.coerce.number({ message: 'Vui lòng chọn vị trí câu hỏi.' }),
    allowOtherAnswer: z.boolean().optional(),
    isRequired: z.boolean().optional(),
    minAge: z.coerce.number().optional(),
    maxAge: z.coerce.number().optional(),
});

export type CreateQuestionFormData = z.infer<typeof createQuestionSchema>;

const resolver = zodResolver(createQuestionSchema);

export default function QuestionDialog({
    isOpen,
    setIsOpen,
    onQuestionCreated,
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

        },
        defaultValues: {
            ...defaultData,
            allowOtherAnswer: false,
            isRequired: true,
        }
    });

    const type = watch('type');

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


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="">
                <DialogHeader>
                    <DialogTitle>Thêm câu hỏi mới</DialogTitle>
                    <DialogDescription>
                        Câu hỏi được tạo sẽ tự động được thêm vào ngân hàng câu hỏi.
                    </DialogDescription>
                </DialogHeader>
                <Form method='POST' onSubmit={(e) => {
                    e.preventDefault();
                }} className='flex flex-col gap-3'>
                    <div className="">
                        <Label className='font-bold'>Loại câu hỏi</Label>
                        <Controller
                            control={control}
                            name="type"
                            render={({ field: { value, onChange } }) => (
                                <Select value={value?.toString()} onValueChange={onChange}>
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
                            }} placeholder='Thêm lựa chọn mới...' />
                            <Button type='button' variant={'outline'} size={'icon'}
                                onClick={addOption} disabled={newOption.trim() === ''}>
                                <CirclePlus />
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 my-3">
                        <Controller
                            control={control}
                            name='isRequired'
                            render={({ field: { value, onChange } }) => (
                                <div className="flex items-center space-x-2">
                                    <Switch className='data-[state=checked]:bg-red-600' id="isRequired" checked={value} onCheckedChange={onChange} />
                                    <Label htmlFor="isRequired">Bắt buộc</Label>
                                </div>
                            )}
                        />
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

                    <DialogFooter>
                        <Button type="button" onClick={() => {
                            if (!isValid) {
                                trigger();
                            } else {
                                onQuestionCreated(getFormValues());
                                setIsOpen(false);
                                reset();
                                toast.success('Thêm thành công!', {
                                    position: 'top-center',
                                    duration: 1250
                                })
                            }
                            console.log({ errors });
                        }}>Hoàn tất
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    )
}