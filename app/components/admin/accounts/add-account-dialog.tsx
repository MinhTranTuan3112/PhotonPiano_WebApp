import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Form, useFetcher, useNavigation, useSearchParams } from '@remix-run/react'
import { Button } from '~/components/ui/button';
import { ActionResult } from '~/lib/types/action-result';
import useLoadingDialog from '~/hooks/use-loading-dialog';
import { useRemixForm } from 'remix-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Input } from '~/components/ui/input';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';

type Props = {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    idToken: string,
    isTeacher: boolean
}

const createAccountSchema = z
    .object({
        email: z
            .string({ message: "Email can not be empty." })
            .email({ message: "Invalid email." }),
        fullName: z
            .string({ message: "Full name can not be empty." })
            .min(1, { message: "Full name can not be empty." }),
        phone: z
            .string({ message: "Phone can not be empty." })
            .min(10, { message: "Invalid phone number" }),
        isTeacher: z.string(),
        idToken: z.string()
    });

type CreateAccountSchema = z.infer<typeof createAccountSchema>;
const resolver = zodResolver(createAccountSchema);


export default function AddAccountDialog({ isOpen, setIsOpen, idToken, isTeacher }: Props) {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigation = useNavigation();
    const fetcher = useFetcher<ActionResult>();

    const { loadingDialog } = useLoadingDialog({
        fetcher,
        action: () => {
            setIsOpen(false)
            setSearchParams([...searchParams])
        }
    })

    const {
        handleSubmit,
        formState: { errors },
        register,
        control
    } = useRemixForm<CreateAccountSchema>({
        mode: "onSubmit",
        resolver,
        submitConfig: { action: `/endpoint/accounts`, method: 'POST' },
        fetcher,
        defaultValues: {
            idToken: idToken,
        }
    });

    const { open: handleOpenConfirmationDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm Adding',
        description: 'Do you want to add this account? They wil be received an email annouced that their account is created via the specified email',
        onConfirm: handleSubmit,
        confirmText: 'Add',
    });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className=''>
                <DialogHeader>
                    <DialogTitle>{isTeacher ? "Create New Teacher" : "Create New Staff"}</DialogTitle>
                </DialogHeader>
                {/* {errors.action && <div className='text-red-500'>{errors.action.message}</div>}
                {errors.classId && <div className='text-red-500'>{errors.classId.message}</div>}
                {errors.idToken && <div className='text-red-500'>{errors.idToken.message}</div>} */}

                <Form onSubmit={handleOpenConfirmationDialog} >
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='flex items-center'>Email</div>
                        <div>
                            <Input {...register('email')} className='w-full' />
                            {errors.email && <div className='text-red-500'>{errors.email.message}</div>}
                        </div>

                        <div className='flex items-center'>Full Name</div>
                        <div>
                            <Input {...register('fullName')} className='w-full' />
                            {errors.fullName && <div className='text-red-500'>{errors.fullName.message}</div>}
                        </div>
                        {/* <input type='hidden' name='roomId' value={selectedRoomId}></input> */}
                        <div className='flex items-center'>Phone</div>
                        <div>
                            <Input {...register('phone')} className='w-full' />
                            {errors.phone && <div className='text-red-500'>{errors.phone.message}</div>}
                        </div>
                        <input {...register('isTeacher')} type='hidden' value={isTeacher ? "true" : "false"} />
                    </div>
                    <div className='flex mt-8 gap-4'>
                        <Button className='flex-grow' type='submit'>Create</Button>
                        <Button className='flex-grow' variant={'outline'} type='button' onClick={() => setIsOpen(false)}>Cancel</Button>

                    </div>
                </Form>
                {loadingDialog}
                {confirmDialog}
            </DialogContent>
        </Dialog>
    )
}