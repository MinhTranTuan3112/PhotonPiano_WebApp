import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchRooms } from '~/lib/services/rooms'
import { QueryPagedRequest } from '~/lib/types/query/query-paged-request'
import { Skeleton } from '../ui/skeleton'
import { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import { ChevronsUpDown, Loader2 } from 'lucide-react'
import { Room } from '~/lib/types/room/room'

type Props = {
    onChange?: (value: string) => void;
    value?: string;
}

async function fetchRoomsData(query: Partial<{
    keyword: string
} & QueryPagedRequest>) {
    const response = await fetchRooms(query);

    return await response.data;
}

export default function RoomsCombobox({ onChange, value: controlledValue }: Props) {

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [value, setValue] = useState('');

    useEffect(() => {

        setValue(controlledValue || '');

        return () => {

        }

    }, [controlledValue]);

    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery({
            queryKey: ['rooms', search],
            queryFn: ({ pageParam = 1 }) =>
                fetchRoomsData({ keyword: search, page: pageParam, pageSize: 5 }),
            getNextPageParam: (lastPage) =>
                lastPage.nextPage ? lastPage.nextPage : undefined,
            enabled: true, // Automatically fetch when the component is mounted
            initialPageParam: 1
        });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollHeight - target.scrollTop === target.clientHeight && hasNextPage) {
            fetchNextPage();
        }
    };

    if (isError) {
        return <div>Error</div>;
    }

    const rooms: Room[] = data?.pages.flatMap(item => item) || [];

    const items = rooms.map(item => {
        return {
            label: item.name,
            value: item.id
        }
    }) || [];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={'justify-between w-full'}
                >
                    {(value && value != '')
                        ? items.find((item) => item.value === value)?.label
                        : 'Chọn phòng thi'}
                    {isLoading ? <Loader2 className='animate-spin' /> : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 popover-content-width-full">
                <Command>
                    <CommandInput
                        placeholder="Nhập tên phòng..."
                        value={search}
                        onValueChange={(value) => setSearch(value)}
                    />
                    <CommandList onScroll={handleScroll} >
                        {isLoading && (
                            <CommandItem>
                                <Loader2 className='animate-spin' />
                            </CommandItem>
                        )}
                        {isError && (
                            <CommandItem>
                                <span>Error loading rooms</span>
                            </CommandItem>
                        )}
                        {items.length > 0 ? (
                            <CommandGroup>
                                {items.map((item, index) => (
                                    <CommandItem key={item.value} onSelect={() => {
                                        setValue(item.value);
                                        onChange?.(item.value);
                                        setOpen(false);
                                    }}>
                                        {item.label}
                                    </CommandItem>
                                ))}
                                {isFetchingNextPage && (
                                    <CommandItem>
                                        <Loader2 className='animate-spin' />
                                    </CommandItem>
                                )}
                            </CommandGroup>
                        ) : (
                            <CommandEmpty>Không tìm thấy phòng.</CommandEmpty>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}