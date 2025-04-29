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
import { Form, useFetcher, useLoaderData, useRouteLoaderData } from '@remix-run/react';
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
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Combobox from '../ui/combobox';
import { objectToFormData } from '~/lib/utils/form';
import { toastWarning } from '~/lib/utils/toast-utils';
import { fetchRefundTuitionSystemConfig } from '~/lib/services/system-config';


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
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [customReason, setCustomReason] = useState<string>("");
    const [showCustomReason, setShowCustomReason] = useState<boolean>(false);

    const {
        handleSubmit,
        formState: { errors, isValid },
        control,
        register,
        getValues: getFormValues,
        watch,
        setValue
    } = useRemixForm<SendApplicationFormData>({
        mode: 'onSubmit',
        resolver: zodResolver(sendApplicationSchema),
        fetcher,
        submitConfig: {
            encType: 'multipart/form-data',
        },
        defaultValues: {
            type: undefined // Initialize with undefined to ensure it's properly set when selected
        },
        stringifyAllValues: false
    });

    const authData = useRouteLoaderData<any>("root");

    const type = watch('type');

    console.log("Dialog open:", isOpen);
    console.log("Application type:", type);
    console.log("ApplicationType.RefundTuition:", ApplicationType.RefundTuition);
    console.log("type === ApplicationType.RefundTuition:", type === ApplicationType.RefundTuition);
    console.log("Auth data:", authData);
    console.log("Auth data idToken:", authData?.idToken);
    console.log("Query enabled:", isOpen && !!authData?.idToken && type === ApplicationType.RefundTuition);

    const { data: refundReasonsData, refetch: refetchRefundReasons } = useQuery({
        queryKey: ['refundReasons', authData?.idToken, type],
        queryFn: async () => {
            console.log("Fetching refund reasons with idToken:", authData?.idToken);
            if (!authData || !authData.idToken) {
                console.log("No auth data or idToken available");
                return { reasonRefundTuition: [] };
            }
            try {
                const response = await fetchRefundTuitionSystemConfig({ idToken: authData.idToken });
                console.log("Refund API response:", response);
                console.log("Refund API response data:", response.data);
                return response.data;
            } catch (error) {
                console.error("Error fetching refund reasons:", error);
                return { reasonRefundTuition: [] };
            }
        },
        refetchOnWindowFocus: false,
        enabled: isOpen && !!authData?.idToken && type === ApplicationType.RefundTuition
    });

    console.log("Raw refundReasonsData:", refundReasonsData);
    let refundReasons: string[] = [];

    if (refundReasonsData) {
        console.log("refundReasonsData.reasonRefundTuition:", refundReasonsData.reasonRefundTuition);
        console.log("Type of refundReasonsData.reasonRefundTuition:", typeof refundReasonsData.reasonRefundTuition);

        if (Array.isArray(refundReasonsData.reasonRefundTuition)) {
            console.log("reasonRefundTuition is an array");
            refundReasons = refundReasonsData.reasonRefundTuition;
        } else if (typeof refundReasonsData.reasonRefundTuition === 'string') {
            console.log("reasonRefundTuition is a string");
            try {
                // Try to parse as JSON
                refundReasons = JSON.parse(refundReasonsData.reasonRefundTuition);
                console.log("Successfully parsed reasonRefundTuition as JSON:", refundReasons);
            } catch (e) {
                console.error("Error parsing refundReasonsData.reasonRefundTuition as JSON:", e);
                // If parsing fails, treat it as a single reason
                refundReasons = [refundReasonsData.reasonRefundTuition];
                console.log("Treating reasonRefundTuition as a single reason:", refundReasons);
            }
        } else if (refundReasonsData.reasonRefundTuition) {
            console.log("reasonRefundTuition is not an array or string, but exists");
            // If it's not an array or string but exists, convert to string and use as a single reason
            refundReasons = [String(refundReasonsData.reasonRefundTuition)];
        }

        // If we have a configValue property directly in the response
        if (refundReasonsData.configValue) {
            console.log("Found configValue property:", refundReasonsData.configValue);
            try {
                const parsedValue = JSON.parse(refundReasonsData.configValue);
                if (Array.isArray(parsedValue)) {
                    console.log("configValue is a valid JSON array");
                    refundReasons = parsedValue;
                } else {
                    console.log("configValue is valid JSON but not an array");
                    refundReasons = [String(parsedValue)];
                }
            } catch (e) {
                console.error("Error parsing configValue as JSON:", e);
                refundReasons = [refundReasonsData.configValue];
            }
        }
    }

    console.log("Processed refund reasons:", refundReasons);

    const { data, isLoading: isFetchingBanks, isError } = useQuery({
        queryKey: ['banks'],
        queryFn: async () => {
            const response = await axios.get('https://api.vietqr.io/v2/banks');

            const banks: Bank[] = await response.data.data;

            return banks;
        },
        refetchOnWindowFocus: false
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

    // Handle reason selection
    const handleReasonChange = (value: string) => {
        setSelectedReason(value);
        if (value === "other") {
            setShowCustomReason(true);
            setValue('reason', customReason);
        } else {
            setShowCustomReason(false);
            setValue('reason', value);
        }
    };

    // Handle custom reason input
    const handleCustomReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setCustomReason(value);
        setValue('reason', value);
    };

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpen, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm action',
        description: 'Are you sure you want to send this application?',
        onConfirm: handleSubmit,
        confirmText: 'Send',
    });

    // Reset reason selection when dialog opens/closes or application type changes
    useEffect(() => {
        if (isOpen) {
            // Reset form values when dialog opens
            if (!type) {
                console.log("Dialog opened, type is undefined");
            }

            if (type === ApplicationType.RefundTuition) {
                console.log("Application type is RefundTuition, refetching refund reasons");
                refetchRefundReasons();
                setSelectedReason("");
                setCustomReason("");
                setShowCustomReason(false);
            }
        } else {
            // Reset form when dialog closes
            setValue('type', undefined);
            console.log("Dialog closed, reset type to undefined");
        }
    }, [isOpen, type, refetchRefundReasons, setValue]);

    // Handle form submission result
    useEffect(() => {
        if (fetcher.data?.success === true) {
            toast.success('Sent successfully!');
            onOpenChange(false);
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toastWarning(fetcher.data.error, {
                duration: 5000
            });
            return;
        }

        return () => {
            // Cleanup
        }
    }, [fetcher.data, onOpenChange]);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange} >
                <DialogContent className='min-w-[1000px]'>
                    <ScrollArea className='h-96 px-4'>
                        <Form method='POST' 
                            onSubmit={handleSubmit} 
                            action='/account/applications' 
                            navigate={false}
                            encType='multipart/form-data'
                            className='px-1'>
                            <DialogHeader>
                                <DialogTitle>Send a new application</DialogTitle>
                                <DialogDescription>
                                    Fill in the information below to send a new application.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 my-4">
                                <Controller
                                    control={control}
                                    name='type'
                                    render={({ field: { onChange, onBlur, value, ref } }) => (
                                        <Select value={value?.toString()} onValueChange={(value) => {
                                            const parsedValue = parseInt(value);

                                            // Use setTimeout to delay the onChange call
                                            // This prevents the dialog from closing when RefundTuition is selected
                                            setTimeout(() => {
                                                onChange(parsedValue);
                                                console.log("Selected application type:", parsedValue);
                                                console.log("ApplicationType.RefundTuition:", ApplicationType.RefundTuition);
                                                console.log("parsedValue === ApplicationType.RefundTuition:", parsedValue === ApplicationType.RefundTuition);
                                            }, 0);
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select application type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Application type</SelectLabel>
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
                                            <Combobox items={bankItems} placeholder='Select bank' value={value} onChange={onChange} />
                                        )}
                                    />
                                    {errors.bankName && <p className="text-red-500">{errors.bankName.message}</p>}
                                    <Input {...register('bankAccountName')} placeholder='Enter account owner name...' />
                                    {errors.bankAccountName && <p className="text-red-500">{errors.bankAccountName.message}</p>}
                                    <Input {...register('bankAccountNumber')} type='number' placeholder='Enter credit no...' />
                                    {errors.bankAccountNumber && <p className="text-red-500">{errors.bankAccountNumber.message}</p>}
                                </>}
                                {type === ApplicationType.RefundTuition ? (
                                    <>
                                        <Controller
                                            control={control}
                                            name='reasonSelect'
                                            render={({ field: { onChange, value } }) => (
                                                <Select 
                                                    value={selectedReason} 
                                                    onValueChange={(value) => {
                                                        console.log("Selected reason:", value);
                                                        handleReasonChange(value);
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a reason" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>Refund Reasons</SelectLabel>
                                                            {refundReasons && refundReasons.length > 0 ? (
                                                                refundReasons.map((reason, index) => {
                                                                    console.log("Rendering refund reason:", reason);
                                                                    return (
                                                                        <SelectItem key={index} value={reason}>
                                                                            {reason}
                                                                        </SelectItem>
                                                                    );
                                                                })
                                                            ) : (
                                                                <SelectItem value="" disabled>
                                                                    No reasons available
                                                                </SelectItem>
                                                            )}
                                                            <SelectItem value="other">Other (specify)</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {showCustomReason && (
                                            <Textarea 
                                                value={customReason}
                                                onChange={handleCustomReasonChange}
                                                placeholder='Enter your reason...' 
                                            />
                                        )}
                                    </>
                                ) : (
                                    <Textarea {...register('reason')} placeholder='Enter reason...' />
                                )}
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
                                <Button type="button" Icon={Send} iconPlacement='left' isLoading={isSubmitting}
                                    disabled={isSubmitting}
                                    onClick={handleOpen}>
                                    {isSubmitting ? 'Sending' : 'Send'}
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
