import { Send } from 'lucide-react';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Form, useFetcher } from '@remix-run/react';
import { useRemixForm } from 'remix-hook-form';
import { SendApplicationFormData, sendApplicationSchema } from '~/lib/types/application/application';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller } from 'react-hook-form';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '../ui/select';
import { APPLICATION_TYPE } from '~/lib/utils/constants';
import { Textarea } from '../ui/textarea';
import { FileUpload } from '../ui/file-upload';
import { action } from '~/routes/account.applications._index';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';

type Props = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function SendApplicationDialog({ isOpen, onOpenChange }: Props) {

    const fetcher = useFetcher<typeof action>();

    const {
        handleSubmit,
        formState: { errors },
        control,
        register,
    } = useRemixForm<SendApplicationFormData>({
        mode: 'onSubmit',
        resolver: zodResolver(sendApplicationSchema),
        fetcher
    });

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpen, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận gửi đơn?',
        description: 'Bạn có chắc chắn muốn gửi đơn này không?',
        onConfirm: handleSubmit,
        confirmText: 'Gửi đơn',
    })

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Đã gửi đơn thành công!');
            onOpenChange(false);
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toast.error(fetcher.data.error);
            return;
        }


        return () => {

        }

    }, [fetcher.data]);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent>
                    <Form method='POST' onSubmit={handleOpen} action='/account/applications' navigate={false}
                        encType='multipart/form-data'>
                        <DialogHeader>
                            <DialogTitle>Gửi đơn mới</DialogTitle>
                            <DialogDescription>
                                Gửi đơn từ, thủ tục liên quan đến vấn đề đào tạo tại trung tâm.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-3 my-4">
                            <Controller
                                control={control}
                                name='type'
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <Select value={value?.toString()} onValueChange={onChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn loại đơn" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Loại đơn</SelectLabel>
                                                {APPLICATION_TYPE.map((type, index) => (
                                                    <SelectItem key={index} value={index.toString()}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.type && <p className="text-red-500">{errors.type.message}</p>}
                            <Textarea {...register('reason')} placeholder='Nhập lý do...' />
                            {errors.reason && <p className="text-red-500">{errors.reason.message}</p>}
                            <Controller
                                control={control}
                                name='file'
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <FileUpload onChange={onChange} />
                                )}
                            />
                            {errors.file && <p className="text-red-500">{errors.file.message}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="submit" Icon={Send} iconPlacement='left' isLoading={isSubmitting}
                                disabled={isSubmitting}>
                                {isSubmitting ? 'Đang gửi' : 'Gửi đơn'}
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>
            {confirmDialog}
        </>
    )
}