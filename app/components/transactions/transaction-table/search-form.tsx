import { zodResolver } from '@hookform/resolvers/zod';
import { Form, useSearchParams } from '@remix-run/react'
import { Banknote, Search } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { MultiSelect } from '~/components/ui/multi-select';
import { PaymentMethod, PaymentStatus } from '~/lib/types/transaction/transaction';
import VnPayLogo from '../../../lib/assets/images/vnpay.webp'
import { Input } from '~/components/ui/input';
import { getParsedParamsArray, trimQuotes } from '~/lib/utils/url';
import { DatePickerInput } from '~/components/ui/date-picker-input';

type Props = {}

export const searchSchema = z.object({
    statuses: z.array(z.string()).optional(),
    methods: z.array(z.string()).optional(),
    transactionCode: z.string().optional(),
    startDate: z.coerce.date({ message: 'Invalid date.' }).optional(),
    endDate: z.coerce.date({ message: 'Invalid date.' }).optional(),
});

function VnPayLogoImage() {
    return <img src={VnPayLogo} alt="" className="size-3" />
}

type SearchFormData = z.infer<typeof searchSchema>;

const resolver = zodResolver(searchSchema);

const paymentMethodOptions = [
    { label: 'Cash', value: PaymentMethod.Cash.toString(), icon: Banknote },
    { label: 'VNPAY', value: PaymentMethod.VnPay.toString(), icon: VnPayLogoImage },
]

const paymentStatusOptions = [
    { label: 'Waiting', value: PaymentStatus.Pending.toString(), icon: undefined },
    { label: 'Successed', value: PaymentStatus.Successed.toString(), icon: undefined },
    { label: 'Failed', value: PaymentStatus.Failed.toString(), icon: undefined },
    { label: 'Canceled', value: PaymentStatus.Canceled.toString(), icon: undefined },
];

export default function SearchForm({ }: Props) {

    const {
        handleSubmit,
        formState: { errors, isSubmitting },
        register,
        control
    } = useRemixForm<SearchFormData>({
        mode: "onSubmit",
        resolver
    });

    const [searchParams, setSearchParams] = useSearchParams();

    return (
        <Form method='GET' action='/account/transactions' onSubmit={handleSubmit} className='flex flex-col gap-4 my-1'>

            <div className="flex flex-row gap-10">
                <Controller
                    name='methods'
                    control={control}
                    render={({ field: { onChange, onBlur, value, ref } }) => (
                        <MultiSelect options={paymentMethodOptions}
                            value={value}
                            defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('methods') })}
                            placeholder='Payment methods'
                            className='md:max-w-[30%]'
                            onValueChange={onChange} />
                    )}
                />
                <Controller
                    name='statuses'
                    control={control}
                    render={({ field: { onChange, onBlur, value, ref } }) => (
                        <MultiSelect options={paymentStatusOptions}
                            value={value}
                            defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('statuses') })}
                            placeholder='Statuses'
                            className='md:max-w-[30%]'
                            onValueChange={onChange} />
                    )}
                />
            </div>

            <div className="flex flex-row gap-10">

                <Controller
                    control={control}
                    name='startDate'
                    render={({ field: { onChange, onBlur, value, ref } }) => (
                        <DatePickerInput value={value} onChange={onChange}
                            ref={ref}
                            defaultValue={trimQuotes(searchParams.get('startDate') || '') || undefined}
                            onBlur={onBlur}
                            placeholder='From date'
                            className='w-full md:max-w-[30%]' />
                    )}
                />

                <Controller
                    control={control}
                    name='endDate'
                    render={({ field: { onChange, onBlur, value, ref } }) => (
                        <DatePickerInput value={value} onChange={onChange}
                            ref={ref}
                            onBlur={onBlur}
                            defaultValue={trimQuotes(searchParams.get('endDate') || '') || undefined}
                            placeholder='To date' 
                            className='w-full md:max-w-[30%]'/>
                    )}
                />


            </div>

            <Input {...register('transactionCode')} placeholder='Enter transaction code...' />

            <div className="">
                <Button type='submit' Icon={Search} iconPlacement='left' isLoading={isSubmitting}
                    disabled={isSubmitting} variant={'theme'}>Search</Button>
            </div>
        </Form>
    );
};