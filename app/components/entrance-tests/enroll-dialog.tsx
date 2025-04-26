import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Form, useActionData, useNavigation, useSubmit } from '@remix-run/react'
import { useQuery } from '@tanstack/react-query'
import axiosInstance from '~/lib/utils/axios-instance'
import { TEST_FEE } from '~/lib/utils/config-name'
import { SystemConfig } from '~/lib/types/config/system-config'
import { Loader2 } from 'lucide-react'
import { formatPrice } from '~/lib/utils/price'
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog'
import { action } from '~/routes/enroll'
import { toast } from 'sonner'
import { toastWarning } from '~/lib/utils/toast-utils'

type Props = {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
}

export default function EnrollDialog({ isOpen, setIsOpen }: Props) {

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Register for entrance test to enroll
                    </DialogTitle>
                    {/* <DialogDescription>
                            Hãy xác nhận các thông tin sau để tiến hành đăng ký.
                            </DialogDescription> */}
                </DialogHeader>
                <EnrollForm />
            </DialogContent>
        </Dialog>
    )
}


function EnrollForm() {

    const navigation = useNavigation();
    const [isAgreed, setIsAgreee] = useState(false);

    const submit = useSubmit();

    const isSubmitting = navigation.state === 'submitting';

    const { data, isLoading, isError } = useQuery({
        queryKey: ['fee-config'],
        queryFn: async () => {
            const response = await axiosInstance.get(`/system-configs/${TEST_FEE}`);

            return await response.data;
        },
        retry: false,
        refetchOnWindowFocus: false
    });

    const feeConfig = data ? data as SystemConfig : undefined;

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm enrollment',
        description: 'Confirm register for entrance test?',
        onConfirm: () => {
            submit(null, {
                method: 'POST',
                action: '/enroll'
            });
        }
    });

    const actionData = useActionData<typeof action>();

    useEffect(() => {

        if (actionData?.success === false) {
            toastWarning(actionData?.error);
            return;
        }

        return () => {

        }

    }, [actionData]);


    return <>
        <Form method='POST' action='/enroll'>
            <div className='text-gray-600 italic text-sm mb-4'>
                To avoid spam registration requests, Photon Piano Center will charge a fee of
                {' '}
                <span className='font-bold'>{isLoading ? (
                    <Loader2 className='animate-spin' />
                ) : (
                    <>
                        {isError
                            ? '100.000'
                            : formatPrice(parseInt(feeConfig?.configValue || '100000'))} đ
                    </>
                )}</span>
                {' '}
                per registration request
            </div>
            <div className='flex gap-4 items-start mb-3'>
                <Checkbox checked={isAgreed} onCheckedChange={(e) => setIsAgreee(!!e)} />
                <span className='text-sm'>I agree with <a className='underline font-bold' href='/'>terms and conditions</a>  Photon Piano center</span>
            </div>
            <RadioGroup defaultValue='vnpay'>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="vnpay" id="r1" />
                    <div className='flex place-content-between w-full items-center'>
                        <Label htmlFor="r1">Vnpay</Label>
                        <img src='/images/vnpay.webp' className='w-8' />
                    </div>
                </div>
            </RadioGroup>
            <div className='flex justify-end my-4 gap-4 items-end'>
                <div>Total : </div>
                <div className='font-extrabold text-xl'>
                    {isLoading ? (
                        <Loader2 className='animate-spin' />
                    ) : (
                        <>
                            {isError
                                ? '100.000'
                                : formatPrice(parseInt(feeConfig?.configValue || '100000'))} đ
                        </>
                    )}
                </div>
            </div>
            <div className='w-full flex gap-4 '>
                <Button disabled={!isAgreed}
                    type="button" className='w-full' isLoading={isSubmitting}
                    onClick={handleOpenConfirmDialog}>
                    Register
                </Button>
            </div>
        </Form>
        {confirmDialog}
    </>
}