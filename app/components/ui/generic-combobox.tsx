import { useInfiniteQuery } from '@tanstack/react-query'
import { QueryPagedRequest } from '~/lib/types/query/query-paged-request'
import { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import { ChevronsUpDown, Loader2 } from 'lucide-react'
import { useDebounce } from '~/hooks/use-debounce'
import { PagedResult } from '~/lib/types/query/paged-result'

type Props<T> = {
    queryKey: string;
    fetcher: (query: Partial<{ keyword: string } & QueryPagedRequest> & { idToken: string }) => Promise<PagedResult<T>>;
    mapItem: (item: T) => { label: string | React.ReactNode; value: string };  // Mapping function
    idToken: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    onItemChange?: (item: T) => void; // Optional callback for item change
    value?: string;
    maxItemsDisplay?: number;
    placeholder?: string;
    errorText?: string;
    emptyText?: string;
    className?: string;
    prechosenItem?: T;
    hasPrechosenItemDisplay?: boolean;
}

export default function GenericCombobox<T>({
    queryKey,
    fetcher,
    mapItem,
    idToken,
    onChange, value: controlledValue, defaultValue, maxItemsDisplay = 10,
    placeholder = 'Chọn',
    errorText = 'Lỗi',
    emptyText = 'Không có kết quả.',
    className,
    prechosenItem,
    onItemChange,
    hasPrechosenItemDisplay = true
}: Props<T>) {

    const [isPreloading, setIsPreloading] = useState(true);
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, isPreloading ? 0 : 300);
    const [value, setValue] = useState('');
    // Store prechosenItem only when the component first mounts
    const [initialItems, setInitialItems] = useState<T[]>(prechosenItem ? [prechosenItem] : []);

    useEffect(() => {

        setValue(defaultValue ? defaultValue : controlledValue || '');

        setIsPreloading(false);

        return () => {

        }

    }, [controlledValue]);

    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery({
            queryKey: [queryKey, debouncedSearchTerm],
            queryFn: ({ pageParam = 1 }) =>
                fetcher({ keyword: debouncedSearchTerm, page: pageParam, pageSize: maxItemsDisplay, idToken: idToken || '' }),
            getNextPageParam: (lastResult) =>
                lastResult.metadata && lastResult.metadata.page < lastResult.metadata.totalPages
                    ? lastResult.metadata.page + 1
                    : undefined,
            enabled: true, // Automatically fetch when the component is mounted
            initialPageParam: 1,
            refetchOnWindowFocus: false,
        });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollHeight - target.scrollTop === target.clientHeight && hasNextPage) {
            fetchNextPage();
        }
    };

    if (isError) {
        return <div>{errorText}</div>;
    }

    let fetchedData: T[] = [
        ...initialItems,
        ...(data?.pages
            .flatMap(item => item.data)
            .filter(item => prechosenItem ? mapItem(item).value !== mapItem(prechosenItem).value : true) || [])
    ];

    const items = fetchedData.map(mapItem) || [];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={`justify-between w-full ${className}`}
                >
                    {(value && value != '')
                        ? items.find((item) => item.value === value)?.label
                        : placeholder}

                    {isLoading ? <Loader2 className='animate-spin' /> : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 popover-content-width-full">
                <Command defaultValue={defaultValue}>
                    <CommandInput
                        placeholder={placeholder}
                        value={searchTerm}
                        onValueChange={(value) => setSearchTerm(value)}
                    />
                    <CommandList onScroll={handleScroll} >
                        {isLoading && (
                            <CommandItem>
                                <Loader2 className='animate-spin' />
                            </CommandItem>
                        )}
                        {isError && (
                            <CommandItem>
                                <span>{errorText}</span>
                            </CommandItem>
                        )}
                        {items.length > 0 ? (
                            <CommandGroup>
                                {hasPrechosenItemDisplay ? items.map((item) => (
                                    <CommandItem key={item.value} onSelect={() => {
                                        setValue(item.value);
                                        onChange?.(item.value);
                                        onItemChange?.(fetchedData.find(i => mapItem(i).value === item.value) as T);
                                        setOpen(false);
                                    }}>
                                        {item.label}
                                    </CommandItem>
                                )) : items.filter(i => i.value !== controlledValue).map((item) => (
                                    <CommandItem key={item.value} onSelect={() => {
                                        setValue(item.value);
                                        onChange?.(item.value);
                                        onItemChange?.(fetchedData.find(i => mapItem(i).value === item.value) as T);
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
                            <CommandEmpty>{emptyText}</CommandEmpty>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}