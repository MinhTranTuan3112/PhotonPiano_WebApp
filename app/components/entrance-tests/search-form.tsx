import { Form, Link, useLoaderData, useLocation, useSearchParams } from '@remix-run/react'
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

type Props = {}

export const entranceTestsSearchSchema = z.object({
    q: z.string().optional(),
    shifts: z.array(z.string()).optional(),
    roomIds: z.array(z.string()).optional()
});

export type EntranceTestsSearchFormData = z.infer<typeof entranceTestsSearchSchema>;

export const resolver = zodResolver(entranceTestsSearchSchema);

export default function SearchForm({ }: Props) {

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

    const [searchParams, _] = useSearchParams();

    const { pathname } = useLocation();

    return (
        <Form method='GET'
            onSubmit={handleSubmit}
            action='/staff/entrance-tests'
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
                <Controller
                    name='roomIds'
                    control={control}
                    render={({ field: { value = [], onChange } }) => (
                        // <RoomsMultiSelect
                        //     idToken={query.idToken}
                        //     value={value}
                        //     onValueChange={onChange}
                        //     placeholder='Chọn phòng'
                        //     className='w-full max-w-[40%]'
                        //     defaultValue={getParsedParamsArray({ paramsValue: searchParams.get('roomIds') }).map(String)} />
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

            <div className="w-full flex flex-row gap-3">
                <Link className={`${buttonVariants({ variant: "theme" })} size-52 font-bold 
                                      flex flex-row gap-3`}
                    to={pathname ? `${pathname}` : '/'}
                    replace={true}
                    reloadDocument={true}>
                    <FilterX /> Reset filter
                </Link>
                <Button type='submit' isLoading={isSubmitting}
                    disabled={isSubmitting} Icon={Search} iconPlacement='left'>
                    Search
                </Button>
            </div>
        </Form>
    )
}

