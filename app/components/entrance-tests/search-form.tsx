import { Form, Link, useLoaderData, useLocation } from '@remix-run/react'
import { Input } from '../ui/input'
import { FilterX, Search } from 'lucide-react'
import { Button, buttonVariants } from '../ui/button'
import { z } from 'zod'
import { useRemixForm } from 'remix-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller } from 'react-hook-form'
import { MultiSelect } from '../ui/multi-select'
import { SHIFT_TIME } from '~/lib/utils/constants'
import { getParsedParamsArray, trimQuotes } from '~/lib/utils/url'
import { loader } from '~/routes/staff.entrance-tests._index'
import GenericMultiSelect from '../ui/generic-multiselect'
import { fetchRooms } from '~/lib/services/rooms'
import { PaginationMetaData } from '~/lib/types/pagination-meta-data'
import { Room } from '~/lib/types/room/room'
import { Role } from '~/lib/types/account/account'

type Props = {
    searchParams: URLSearchParams;
    role: Role;
}

export const entranceTestsSearchSchema = z.object({
    q: z.string().optional(),
    shifts: z.array(z.string()).optional(),
    roomIds: z.array(z.string()).optional()
});

export type EntranceTestsSearchFormData = z.infer<typeof entranceTestsSearchSchema>;

export const resolver = zodResolver(entranceTestsSearchSchema);

export default function SearchForm({
    searchParams,
    role
}: Props) {

    const { query } = useLoaderData<typeof loader>();

    const {
        handleSubmit,
        formState: { isSubmitting },
        register,
        control
    } = useRemixForm<EntranceTestsSearchFormData>({
        mode: 'onSubmit',
        resolver
    });

    const { pathname } = useLocation();

    return (
        <Form method='GET'
            onSubmit={handleSubmit}
            className='my-3 flex flex-col gap-3'>

            <div className="w-full">
                <Input {...register('q')} placeholder='Search here...' className='w-full max-w-[50%]'
                    defaultValue={trimQuotes(searchParams.get('q') || '')} />
            </div>

            <div className="flex flex-row gap-3 w-full">
                <Controller
                    name='shifts'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <MultiSelect
                            options={SHIFT_TIME.map((shift, index) => {
                                return { label: `Shift ${index + 1}: ${shift}`, value: index.toString() }
                            })}
                            defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('shifts') }).map(String)}
                            value={value}
                            onValueChange={onChange}
                            placeholder='Select test shift'
                            className='w-full max-w-[40%]'
                        />
                    )}
                />
                {role !== Role.Student && (
                    <div className="max-w-[50%] w-full">
                        <Controller
                            name='roomIds'
                            control={control}
                            render={({ field: { value = [], onChange } }) => (
                                <GenericMultiSelect<Room>
                                    defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('roomIds') }).map(String)}
                                    queryKey='rooms'
                                    fetcher={async (query) => {
                                        const response = await fetchRooms({ ...query });
                                        const headers = response.headers;
                                        const metadata: PaginationMetaData = {
                                            page: parseInt(headers['x-page'] || '1'),
                                            pageSize: parseInt(headers['x-page-size'] || '10'),
                                            totalPages: parseInt(headers['x-total-pages'] || '1'),
                                            totalCount: parseInt(headers['x-total-count'] || '0'),
                                        };
                                        return {
                                            data: response.data,
                                            metadata
                                        }
                                    }}
                                    mapItem={(item) => {
                                        return {
                                            label: item?.name,
                                            value: item?.id
                                        }
                                    }}
                                    idToken={query.idToken}
                                    value={value}
                                    onValueChange={onChange}
                                    placeholder='Select room'
                                    emptyText='No rooms found.'
                                    errorText='Errors loading rooms.'
                                />
                            )}
                        />
                    </div>
                )}
            </div>

            <div className="w-full flex flex-row gap-3">
                <Link className={`${buttonVariants({ variant: "outline" })} size-52 font-bold 
                                      flex flex-row gap-3`}
                    to={pathname ? `${pathname}` : '/'}
                    replace={true}
                    reloadDocument={true}>
                    <FilterX /> Reset filter
                </Link>
                <Button type='submit' isLoading={isSubmitting}
                    variant={'theme'}
                    disabled={isSubmitting} Icon={Search} iconPlacement='left'>
                    Search
                </Button>
            </div>
        </Form>
    )
}

