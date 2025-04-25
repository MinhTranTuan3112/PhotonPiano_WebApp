import { zodResolver } from '@hookform/resolvers/zod';
import { Form, useLocation } from '@remix-run/react'
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search } from 'lucide-react';
import { MultiSelect } from '../ui/multi-select';
import { APPLICATION_STATUS, APPLICATION_TYPE } from '~/lib/utils/constants';
import { Controller } from 'react-hook-form';

type Props = {}

const searchSchema = z.object({
    q: z.string().optional(),
    types: z.array(z.string()).optional(),
    statuses: z.array(z.string()).optional(),
});

type SearchFormData = z.infer<typeof searchSchema>;

export default function SearchForm({ }: Props) {

    const { pathname } = useLocation();

    const {
        handleSubmit,
        formState: { errors, isSubmitting },
        control,
        register
    } = useRemixForm<SearchFormData>({
        mode: 'onSubmit',
        resolver: zodResolver(searchSchema)
    })

    return (
        <Form method='GET' action={pathname} className='my-3 flex flex-col gap-3' onSubmit={handleSubmit}>

            <Input {...register('q')} placeholder='Search applications...' />
            {errors.q && <div className='text-red-500'>{errors.q.message}</div>}


            <div className="flex flex-row gap-2 max-w-[65%]">

                <div className="w-full">
                    <Controller
                        control={control}
                        name='types'
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <MultiSelect
                                options={APPLICATION_TYPE.map((type, index) => {
                                    return {
                                        label: type,
                                        value: index.toString(),
                                        icon: undefined
                                    }
                                })}
                                value={value}
                                onValueChange={onChange}
                                ref={ref}
                                onBlur={onBlur}
                                placeholder='Select application type'
                            />
                        )}
                    />
                    {errors.types && <div className='text-red-500'>{errors.types.message}</div>}
                </div>

                <div className="w-full">

                    <Controller
                        control={control}
                        name='statuses'
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <MultiSelect
                                options={APPLICATION_STATUS.map((status, index) => {
                                    return {
                                        label: status,
                                        value: index.toString(),
                                    }
                                })}
                                value={value}
                                onValueChange={onChange}
                                ref={ref}
                                onBlur={onBlur}
                                placeholder='Status'
                            />
                        )}
                    />

                </div>


            </div>

            <div className="max-w-[30%]">
                <Button type='submit' isLoading={isSubmitting}
                    disabled={isSubmitting} Icon={Search} iconPlacement='left'>
                    Search
                </Button>
            </div>

        </Form>
    );
};