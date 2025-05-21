import { Form, useFetcher } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { RoomStatus } from '~/lib/types/room/room';
import { toastWarning } from '~/lib/utils/toast-utils';
import { action, RoomFormData, roomResolver } from '~/routes/admin.rooms';

type RoomDialogProps = {
    isEdit?: boolean;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
} & Partial<RoomFormData>;

export default function RoomDialog({ isEdit = false, isOpen, setIsOpen, ...defaultData }: RoomDialogProps) {

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const {
        handleSubmit,
        formState: { errors },
        control,
        register,
    } = useRemixForm<RoomFormData>({
        mode: 'onSubmit',
        resolver: roomResolver,
        fetcher,
        defaultValues: {
            ...defaultData,
            roomAction: isEdit ? 'update' : 'create',
        }
    });

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: isEdit ? 'Update room' : 'Create new room',
        description: isEdit ? 'Are you sure you want to update this room?' : 'Are you sure you want to create a new room?',
        onConfirm: handleSubmit
    });

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success(isEdit ? 'Update room successfully' : 'Create new room successfully');
            setIsOpen(false);
            return;
        }

        if (fetcher.data?.success === false) {
            if (fetcher.data.error) {
                toastWarning(fetcher.data.error, {
                    duration: 5000
                });
            }
            return;
        }

        return () => {

        }
    }, [fetcher.data]);


    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="min-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? 'Update room' : 'Create new room'}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? 'Update the room information.' : 'Create a new room.'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form method='POST' className='flex flex-col gap-5'>
                        <div className="flex flex-row gap-2 items-center">
                            <Label htmlFor='name'>Name:</Label>
                            <Input {...register('name')} id='name' placeholder='Enter room name...' />
                        </div>
                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                        <div className="flex flex-row gap-2 items-center">
                            <Label htmlFor='capacity'>Capacity:</Label>
                            <Input {...register('capacity')} id='capacity' type='number' placeholder='Enter room capacity...' />
                        </div>

                        <div className="flex flex-row gap-2 items-center">
                            <Label>Is opened:</Label>
                            <Controller
                                control={control}
                                name='status'
                                render={({ field: { onChange, value } }) => (
                                    <Switch value={value === RoomStatus.Opened ? 1 : 0}
                                        onCheckedChange={(checked) => onChange(checked ? RoomStatus.Opened : RoomStatus.Closed)}
                                        className='data-[state=checked]:bg-theme'
                                    />
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" onClick={handleOpenConfirmDialog}
                                isLoading={isSubmitting}
                                disabled={isSubmitting} variant={'theme'}>{isEdit ? 'Save' : 'Create'}</Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>
            {confirmDialog}
        </>
    )
}


export function useRoomDialog({
    ...props
}: Omit<RoomDialogProps, 'isOpen' | 'setIsOpen'>) {

    const [isOpen, setIsOpen] = useState(false);


    const roomDialog = (<RoomDialog {...props} isOpen={isOpen} setIsOpen={setIsOpen} />);

    return {
        roomDialog,
        open: () => setIsOpen(true),
    }

}