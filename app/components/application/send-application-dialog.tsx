import { Loader2, Send } from 'lucide-react';
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
import { ApplicationType, SendApplicationFormData, sendApplicationSchema } from '~/lib/types/application/application';
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
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Combobox from '../ui/combobox';


type Props = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

type Bank = {
    id: number;
    shortName: string;
    logo: string;
}

export default function SendApplicationDialog({ isOpen, onOpenChange }: Props) {

    const fetcher = useFetcher<typeof action>();

    const {
        handleSubmit,
        formState: { errors, isValid },
        control,
        register,
        getValues: getFormValues,
        watch
    } = useRemixForm<SendApplicationFormData>({
        mode: 'onSubmit',
        resolver: zodResolver(sendApplicationSchema),
        fetcher,
        stringifyAllValues: false
    });

    const { data, isLoading: isFetchingBanks, isError } = useQuery({
        queryKey: ['banks'],
        queryFn: async () => {
            const response = await axios.get('https://api.vietqr.io/v2/banks');

            const banks: Bank[] = await response.data.data;

            return banks;
        }
    });

    const banks = data ? data as Bank[] : [];

    const bankItems = banks.map((bank) => ({
        label: (
            <div className='flex items-center gap-2'>
                <img src={bank.logo} alt={bank.shortName} className='h-7' />
                <div>{bank.shortName}</div>
            </div>
        ),
        value: bank.shortName
    }));
    

    const type = watch('type');

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpen, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận gửi đơn?',
        description: 'Bạn có chắc chắn muốn gửi đơn này không?',
        onConfirm: handleSubmit,
        confirmText: 'Gửi đơn',
    });

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Đã gửi đơn thành công!');
            onOpenChange(false);
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toast.warning(fetcher.data.error);
            return;
        }


        return () => {

        }

    }, [fetcher.data]);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange} >
                <DialogContent>
                    <ScrollArea className='h-96 px-4'>
                        <Form method='POST' onSubmit={handleSubmit} action='/account/applications' navigate={false}
                            encType='multipart/form-data'
                            className='px-1'>
                            <DialogHeader>
                                <DialogTitle>Gửi đơn mới</DialogTitle>
                                <DialogDescription>
                                    Gửi đơn từ, thủ tục liên quan đến vấn đề đào tạo tại trung tâm.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 my-4">
                                <Controller
                                    control={control}
                                    name='type'
                                    render={({ field: { onChange, onBlur, value, ref } }) => (
                                        <Select value={value?.toString()} onValueChange={(value) => {
                                            onChange(parseInt(value));
                                            console.log(getFormValues());

                                        }}>
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
                                {type === ApplicationType.RefundTuition && <>
                                    <Controller
                                        control={control}
                                        name='bankName'
                                        render={({ field: { onChange, onBlur, value, ref } }) => (
                                            // <Select value={value} onValueChange={onChange}>
                                            //     <SelectTrigger>
                                            //         <SelectValue placeholder="Chọn ngân hàng" />
                                            //     </SelectTrigger>
                                            //     <SelectContent>
                                            //         <SelectGroup>
                                            //             <SelectLabel className='text-center'>Ngân hàng</SelectLabel>
                                            //             {isFetchingBanks ? <Loader2 className='animate-spin' /> :
                                            //                 banks.map((bank) => (
                                            //                     <SelectItem key={bank.id} value={bank.shortName}
                                            //                     >
                                            //                         <div className='flex items-center gap-2'>
                                            //                             <img src={bank.logo} alt={bank.shortName} className='h-7' />
                                            //                             <div>{bank.shortName}</div>
                                            //                         </div>
                                            //                     </SelectItem>
                                            //                 ))}
                                            //         </SelectGroup>
                                            //     </SelectContent>
                                            // </Select>
                                            <Combobox items={bankItems} placeholder='Chọn ngân hàng' value={value} onChange={onChange}/>
                                        )}
                                    />
                                    {errors.bankName && <p className="text-red-500">{errors.bankName.message}</p>}
                                    <Input {...register('bankAccountName')} placeholder='Nhập tên chủ tài khoản...' />
                                    {errors.bankAccountName && <p className="text-red-500">{errors.bankAccountName.message}</p>}
                                    <Input {...register('bankAccountNumber')} type='number' placeholder='Nhập số tài khoản...' />
                                    {errors.bankAccountNumber && <p className="text-red-500">{errors.bankAccountNumber.message}</p>}
                                </>}
                                <Textarea {...register('reason')} placeholder='Nhập lý do...' />
                                {errors.reason && <p className="text-red-500">{errors.reason.message}</p>}
                                <Controller
                                    control={control}
                                    name='file'
                                    render={({ field: { onChange: onFileChange, onBlur, value, ref } }) => (
                                        <FileUpload onChange={onFileChange} />
                                    )}
                                />
                                {errors.file && "message" in errors.file && <p className="text-red-500">{errors.file.message}</p>}
                            </div>
                            <DialogFooter>
                                <Button type="submit" Icon={Send} iconPlacement='left' isLoading={isSubmitting}
                                    disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang gửi' : 'Gửi đơn'}
                                </Button>
                            </DialogFooter>
                        </Form>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
            {confirmDialog}
        </>
    )
}

