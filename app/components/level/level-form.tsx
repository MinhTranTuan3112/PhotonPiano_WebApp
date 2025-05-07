import { zodResolver } from '@hookform/resolvers/zod';
import { FetcherWithComponents, Form, useNavigate } from '@remix-run/react'
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { Level, LevelDetails } from '~/lib/types/account/account'
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { HexColorPicker } from "react-colorful";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import GenericCombobox from '../ui/generic-combobox';
import { requireAuth } from '~/lib/utils/auth';
import { fetchLevels } from '~/lib/services/level';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';

type Props = {
    isEditing?: boolean;
    fetcher: FetcherWithComponents<any>;
    isSubmitting: boolean;
    idToken: string
} & Partial<LevelDetails>;

export const levelSchema = z.object({
    id: z.string().optional(),
    name: z.string().nonempty({ message: 'Name cannot be empty.' }),
    description: z.string().nonempty({ message: 'Description cannot be empty' }),
    skillsEarned: z.array(z.string()).min(1, { message: 'Skills earned cannot be empty' }),
    slotPerWeek: z.coerce.number().min(1, { message: 'Total slots per week must > 0' }),
    totalSlots: z.coerce.number().min(1, { message: 'Total slots must > 0' }),
    pricePerSlot: z.coerce.number().min(1, { message: 'Price per slot must > 0' }),
    minimumTheoreticalScore: z.coerce.number().min(0, { message: 'Minimum theoretical score must >= 0' }),
    minimumPracticalScore: z.coerce.number().min(0, { message: 'Minimum practical score must >= 0' }),
    themeColor: z.string().optional(),
    nextLevelId: z.string().optional(),
    isGenreDivided: z.boolean().optional(),
});

export type LevelFormData = z.infer<typeof levelSchema>;

export default function LevelForm({ isEditing = true, fetcher, isSubmitting, id, idToken, ...defaultData }: Props) {
    const {
        handleSubmit,
        formState: { errors },
        control,
        setValue: setFormValue,
        getValues: getFormValue,
        register,
        watch
    } = useRemixForm<LevelFormData>({
        mode: 'onSubmit',
        fetcher,
        resolver: zodResolver(levelSchema),
        defaultValues: {
            ...defaultData,
            id
        },
    });

    const skillsEarned = watch('skillsEarned');

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm action',
        description: `Are you sure want to ${isEditing ? 'update' : 'create'} this level?` ,
        confirmText: isEditing ? 'Save' : 'Create',
        onConfirm: handleSubmit
    });

    const [newSkill, setNewSkill] = useState('');
    const [selectedColor, setSelectedColor] = useState<string>(getFormValue('themeColor') || '#000000');
    const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false)

    return (
        <>
            <Form method='POST' className='flex flex-col gap-5'>

                <div className="flex flex-col gap-3 max-w-[70%]">
                    <Label className='font-bold' htmlFor='name'>Name</Label>
                    <Input {...register('name')} id='name' placeholder='Enter level name...' />
                </div>
                {errors.name && <p className='text-red-500 text-sm'>{errors.name.message}</p>}

                <div className="flex flex-col gap-3">
                    <Label className='font-bold' htmlFor='description'>Description</Label>
                    <Textarea {...register('description')} id='description' placeholder='Enter level description...' />
                </div>
                {errors.description && <p className='text-red-500 text-sm'>{errors.description.message}</p>}

                <div className="font-bold text-base">Earned skills</div>
                {skillsEarned?.length > 0 && skillsEarned.map((skill, index) => (
                    <div key={index} className="flex flex-row gap-3 items-center">
                        <Label className='font-bold'>{index + 1}. </Label>
                        <Input placeholder='Enter skills earned...'
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

                <div className="flex flex-row gap-3 w-full lg:max-w-[50%] ">
                    <Label className='font-bold w-64' htmlFor='slotPerWeek'>Slots per week</Label>
                    <Input {...register('slotPerWeek')} id='slotPerWeek'
                        type='number'
                        placeholder='Enter number of slots per week...' />
                </div>
                {errors.slotPerWeek && <p className='text-red-500 text-sm'>{errors.slotPerWeek.message}</p>}

                <div className="flex flex-row gap-3 w-full lg:max-w-[50%] ">
                    <Label className='font-bold w-64' htmlFor='totalSlots'>Total slots</Label>
                    <Input {...register('totalSlots')} id='totalSlots'
                        type='number'
                        placeholder='Enter total slots...' />
                </div>
                {errors.totalSlots && <p className='text-red-500 text-sm'>{errors.totalSlots.message}</p>}

                <div className="flex flex-row gap-3 w-full lg:max-w-[50%] ">
                    <Label className='font-bold w-64' htmlFor='minimumTheoreticalScore'>Minimum theoretical score</Label>
                    <Input {...register('minimumTheoreticalScore')} id='minimumTheoreticalScore'
                        type='number'
                        placeholder='Enter minimum theoretical score...' />
                </div>

                {errors.minimumTheoreticalScore && <p className='text-red-500 text-sm'>{errors.minimumTheoreticalScore.message}</p>}

                <div className="flex flex-row gap-3 w-full lg:max-w-[50%] ">
                    <Label className='font-bold w-64' htmlFor='minimumPracticalScore'>Minimum practical score</Label>
                    <Input {...register('minimumPracticalScore')} id='minimumPracticalScore'
                        type='number'
                        placeholder='Enter minimum practical score...' />
                </div>
                {errors.minimumPracticalScore && <p className='text-red-500 text-sm'>{errors.minimumPracticalScore.message}</p>}

                <div className="flex flex-row gap-3 w-full lg:max-w-[50%] ">
                    <Label className='font-bold w-64' htmlFor='pricePerSlot'>Slot price</Label>
                    <Input {...register('pricePerSlot')} id='pricePerSlot'
                        type='number'
                        placeholder='Enter slot price...' />
                </div>
                {errors.pricePerSlot && <p className='text-red-500 text-sm'>{errors.pricePerSlot.message}</p>}

                <div className="flex flex-row gap-3 w-full items-center">

                    <Label className='font-bold'>Theme color:</Label>
                    <Controller
                        name='themeColor'
                        control={control}
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <HexColorPicker color={value} onChange={(newColor) => {
                                setSelectedColor(newColor);
                                onChange(newColor);
                            }} onBlur={onBlur} />
                        )}
                    />

                    <div className="h-10 w-32 rounded-md" style={{
                        backgroundColor: selectedColor,
                    }}>
                    </div>

                </div>

                <div className="flex flex-row gap-2 items-center">
                    <Label>Next level:</Label>
                    <Controller
                        control={control}
                        name='nextLevelId'
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <GenericCombobox<Level>
                                className='mt-2 w-64'
                                idToken={idToken}
                                queryKey='rooms'
                                fetcher={async (query) => {
                                    const response = await fetchLevels();

                                    const headers = response.headers;

                                    const metadata: PaginationMetaData = {
                                        page: parseInt(headers['x-page'] || '1'),
                                        pageSize: parseInt(headers['x-page-size'] || '10'),
                                        totalPages: parseInt(headers['x-total-pages'] || '1'),
                                        totalCount: parseInt(headers['x-total-count'] || '0'),
                                    };

                                    let data = response.data as Level[]
                                    
                                    data = data.filter(l => l.id !== watch('id'))

                                    return {
                                        data: data,
                                        metadata
                                    };
                                }}
                                mapItem={(item) => ({
                                    label: item?.name,
                                    value: item?.id
                                })}
                                placeholder='Pick a level'
                                emptyText='There is no level available'
                                errorText='Error loading level list.'
                                value={value}
                                onChange={onChange}
                                maxItemsDisplay={10}
                            />
                        )}
                    />

                </div>

                <div className="flex gap-4">
                    <Button type='button' isLoading={isSubmitting} disabled={isSubmitting} onClick={handleOpenConfirmDialog} variant={'theme'} className='w-full max-w-[50%]'>
                        {isEditing ? 'Save' : 'Create'}
                    </Button>
                    {isEditing && <Button type='button' onClick={() => setIsOpenDeleteDialog(true)} variant={'destructive'}>
                        Delete
                    </Button>}
                </div>

            </Form>
            {id && <DeleteDialog id={id} isOpenDialog={isOpenDeleteDialog} setIsOpen={setIsOpenDeleteDialog} idToken={idToken} />}
            {confirmDialog}
        </>
    )
}


function DeleteDialog({ id, isOpenDialog, setIsOpen, idToken }:
    { id: string, isOpenDialog: boolean, setIsOpen: (isOpen: boolean) => void, idToken: string }) {

    const [selectedLevel, setSelectedLevel] = useState<string | undefined>(undefined)

    const navigate = useNavigate()

    const handleDelete = async () => {
        await fetch(`/endpoint/levels`, {
            method: "DELETE",
            body: new URLSearchParams({
                fallBackLevelId: selectedLevel ?? "",
                id: id
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });
        navigate(`/admin/levels`)
    }

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm action',
        description: 'Are you sure want to delete this level? This action can not be rollbacked',
        confirmText: 'Delete',
        onConfirm: handleDelete
    });

    return (
        <Dialog open={isOpenDialog} onOpenChange={setIsOpen}>
            <DialogContent className='w-[36rem]'>
                <DialogTitle>
                    Delete the Level
                </DialogTitle>
                <div>
                    <div className='font-semibold italic mb-4'>Please specify a fallback level, any account or classes that have this level will be changed to the fallback level!</div>
                    <GenericCombobox<Level>
                        className='mt-2 w-64'
                        idToken={idToken}
                        queryKey='rooms'
                        fetcher={async (query) => {
                            const response = await fetchLevels();

                            const headers = response.headers;

                            const metadata: PaginationMetaData = {
                                page: parseInt(headers['x-page'] || '1'),
                                pageSize: parseInt(headers['x-page-size'] || '10'),
                                totalPages: parseInt(headers['x-total-pages'] || '1'),
                                totalCount: parseInt(headers['x-total-count'] || '0'),
                            };

                            let data = response.data as Level[]
                            data = data.filter(l => l.id !== id)

                            return {
                                data: data,
                                metadata
                            };
                        }}
                        mapItem={(item) => ({
                            label: item?.name,
                            value: item?.id
                        })}
                        placeholder='Pick a level'
                        emptyText='There is no level available'
                        errorText='Error loading level list.'
                        value={selectedLevel}
                        onChange={setSelectedLevel}
                        maxItemsDisplay={10}
                    />
                </div>
                <div className='mt-8 flex gap-2 justify-end'>
                    <Button variant={'destructive'} onClick={handleOpenConfirmDialog}>Confirm</Button>
                    <Button variant={'outline'} onClick={() => setIsOpen(false)}>Cancel</Button>
                </div>
            </DialogContent>
            {confirmDialog}
        </Dialog>
    )

}