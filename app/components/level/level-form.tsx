import { zodResolver } from '@hookform/resolvers/zod';
import { FetcherWithComponents, Form } from '@remix-run/react'
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { LevelDetails } from '~/lib/types/account/account'
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';
import { Plus } from 'lucide-react';

type Props = {
    isEditing?: boolean;
    fetcher: FetcherWithComponents<any>;
    isSubmitting: boolean;
} & LevelDetails;

export const levelSchema = z.object({
    id: z.string().optional(),
    name: z.string().nonempty({ message: 'Name cannot be empty.' }),
    description: z.string().nonempty({ message: 'Description cannot be empty' }),
    skillsEarned: z.array(z.string()).min(1, { message: 'Skills earned cannot be empty' }),
    slotPerWeek: z.coerce.number().min(1, { message: 'Total slots per week must > 0' }),
    totalSlots: z.coerce.number().min(1, { message: 'Total slots must > 0' }),
    pricePerSlot: z.coerce.number().min(1, { message: 'Price per slot must > 0' }),
    minimumScore: z.coerce.number().min(0, { message: 'Min score must > 0' }),
    isGenreDivided: z.boolean().optional(),
    nextLevelId: z.string().optional(),
});

export type LevelFormData = z.infer<typeof levelSchema>;

export default function LevelForm({ isEditing = true, fetcher, isSubmitting, ...defaultData }: Props) {

    const {
        handleSubmit,
        formState: { errors },
        control,
        setValue: setFormValue,
        register,
        watch
    } = useRemixForm<LevelFormData>({
        mode: 'onSubmit',
        fetcher,
        resolver: zodResolver(levelSchema),
        defaultValues: {
            ...defaultData
        },
    });

    const skillsEarned = watch('skillsEarned');

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm action',
        description: 'Save the level data?',
        confirmText: 'Save',
        onConfirm: handleSubmit
    });

    const [newSkill, setNewSkill] = useState('');

    return (
        <>
            <Form method='POST' className='flex flex-col gap-5'>

                <div className="flex flex-row gap-3 max-w-[70%]">
                    <Label className='font-bold' htmlFor='name'>Name</Label>
                    <Input {...register('name')} id='name' placeholder='Enter level name...' />
                </div>
                {errors.name && <p className='text-red-500 text-sm'>{errors.name.message}</p>}

                <div className="flex flex-row gap-3">
                    <Label className='font-bold' htmlFor='description'>Description</Label>
                    <Textarea {...register('description')} id='description' placeholder='Enter level description...' />
                </div>
                {errors.description && <p className='text-red-500 text-sm'>{errors.description.message}</p>}

                <div className="font-bold text-base">Earned skills</div>
                {skillsEarned.length > 0 && skillsEarned.map((skill, index) => (
                    <div key={index} className="flex flex-row gap-3 items-center">
                        <Label className='font-bold'>{index + 1}. </Label>
                        <Input {...register(`skillsEarned.${index}`)} placeholder='Enter skills earned...'
                            value={skill}
                            onChange={(e) => {
                                const newSkills = [...skillsEarned];
                                newSkills[index] = e.target.value;
                                setFormValue('skillsEarned', newSkills);
                            }} />
                    </div>
                ))}

                <div className="flex flex-row gap-3 my-3">
                    <Input placeholder='Enter skill...' value={newSkill} onChange={(e) => setNewSkill(prev => e.target.value)} />
                    <Button type='button' variant={'outline'} className='rounded-md' onClick={() => {
                        if (newSkill.trim() === '') {
                            return;
                        }
                        setFormValue('skillsEarned', [...skillsEarned, newSkill]);
                        setNewSkill('');
                    }}>
                        <Plus />
                    </Button>
                </div>

                <div className="flex flex-row gap-3 max-w-[20%]">
                    <Label className='font-bold' htmlFor='slotPerWeek'>Slots per week</Label>
                    <Input {...register('slotPerWeek')} id='slotPerWeek'
                        type='number'
                        placeholder='Enter number of slots per week...' />
                </div>
                {errors.slotPerWeek && <p className='text-red-500 text-sm'>{errors.slotPerWeek.message}</p>}

                <div className="flex flex-row gap-3 max-w-[20%]">
                    <Label className='font-bold' htmlFor='totalSlots'>Total slots</Label>
                    <Input {...register('totalSlots')} id='totalSlots'
                        type='number'
                        placeholder='Enter total slots...' />
                </div>
                {errors.totalSlots && <p className='text-red-500 text-sm'>{errors.totalSlots.message}</p>}

                <div className="flex flex-row gap-3 max-w-[20%]">
                    <Label className='font-bold' htmlFor='pricePerSlot'>Slot price</Label>
                    <Input {...register('pricePerSlot')} id='pricePerSlot'
                        type='number'
                        placeholder='Enter slot price...' />
                </div>
                {errors.pricePerSlot && <p className='text-red-500 text-sm'>{errors.pricePerSlot.message}</p>}

                <div className="">
                    <Button type='button' isLoading={isSubmitting} disabled={isSubmitting} onClick={handleOpenConfirmDialog}>
                        {isEditing ? 'Save' : 'Create'}
                    </Button>
                </div>

            </Form>
            {confirmDialog}
        </>
    )
}