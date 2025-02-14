import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
    CheckIcon,
    XCircle,
    ChevronDown,
    XIcon,
    WandSparkles,
    Loader2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "~/lib/utils";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "../ui/command";
import { QueryPagedRequest } from "~/lib/types/query/query-paged-request";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "~/hooks/use-debounce";
import { PagedResult } from "~/lib/types/query/paged-result";

/**
 * Variants for the multi-select component to handle different styles.
 * Uses class-variance-authority (cva) to define different styles based on "variant" prop.
 */
const multiSelectVariants = cva(
    "m-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300",
    {
        variants: {
            variant: {
                default:
                    "border-foreground/10 text-foreground bg-card hover:bg-card/80",
                secondary:
                    "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                inverted: "inverted",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

/**
 * Props for MultiSelect component
 */
type Props<T> = {
    queryKey: string;
    fetcher: (query: Partial<{ keyword: string } & QueryPagedRequest> & { idToken: string }) => Promise<PagedResult<T>>;
    mapItem: (item: T) => { label: string; value: string };  // Mapping function
    onValueChange: (value: string[]) => void;
    maxItemsDisplay?: number;
    placeholder?: string;
    errorText?: string;
    emptyText?: string;
    defaultValue?: string[];
    animation?: number;
    maxCount?: number;
    modalPopover?: boolean;
    asChild?: boolean;
    className?: string;
    idToken: string;

} & React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof multiSelectVariants>

export default function GenericMultiSelect<T>({
    fetcher,
    mapItem,
    queryKey,
    idToken,
    onValueChange,
    variant,
    defaultValue = [],
    placeholder = "Select options",
    animation = 0,
    maxCount = 3,
    modalPopover = false,
    asChild = false,
    className,
    errorText = 'Lỗi',
    emptyText = 'Không có kết quả.',
    maxItemsDisplay = 10,
    ...props
}: Props<T>) {

    const [isPreloading, setIsPreloading] = React.useState(true);

    const [searchTerm, setSearchTerm] = React.useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, isPreloading ? 0 : 300);

    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery({
            queryKey: [queryKey, debouncedSearchTerm],
            queryFn: ({ pageParam = 1 }) =>
                fetcher({ keyword: debouncedSearchTerm, page: pageParam, pageSize: maxItemsDisplay, idToken }),
            getNextPageParam: (lastResult) =>
                lastResult.metadata?.page < lastResult.metadata?.totalPages ? lastResult.metadata?.page + 1 : undefined,
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
        return <div>{errorText}</div>;
    }

    const fetchedData: T[] = data?.pages.flatMap(item => item.data) || [];

    const items = fetchedData.map(mapItem) || [];

    const [selectedValues, setSelectedValues] =
        React.useState<string[]>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);

    const handleInputKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (event.key === "Enter") {
            setIsPopoverOpen(true);
        } else if (event.key === "Backspace" && !event.currentTarget.value) {
            const newSelectedValues = [...selectedValues];
            newSelectedValues.pop();
            setSelectedValues(newSelectedValues);
            onValueChange(newSelectedValues);
        }
    };

    const toggleOption = (option: string) => {
        const newSelectedValues = selectedValues.includes(option)
            ? selectedValues.filter((value) => value !== option)
            : [...selectedValues, option];
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
    };

    const handleClear = () => {
        setSelectedValues([]);
        onValueChange([]);
    };

    const handleTogglePopover = () => {
        setIsPopoverOpen((prev) => !prev);
    };

    const clearExtraOptions = () => {
        const newSelectedValues = selectedValues.slice(0, maxCount);
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
    };

    const toggleAll = () => {
        if (selectedValues.length === items.length) {
            handleClear();
        } else {
            const allValues = items.map((option) => option.value);
            setSelectedValues(allValues);
            onValueChange(allValues);
        }
    };

    React.useEffect(() => {

        setIsPreloading(false);

        return () => {

        }

    }, []);


    return (
        <Popover
            open={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
            modal={modalPopover}
        >
            <PopoverTrigger asChild>
                <Button
                    onClick={handleTogglePopover}
                    className={cn(
                        "flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto",
                        className
                    )}
                    {...props}
                >
                    {selectedValues.length > 0 ? (
                        <div className="flex justify-between items-center w-full">
                            <div className="flex flex-wrap items-center">
                                {selectedValues.slice(0, maxCount).map((value) => {
                                    const option = items.find((o) => o.value === value);

                                    return (
                                        <Badge
                                            key={value}
                                            className={cn(
                                                isAnimating ? "animate-bounce" : "",
                                                multiSelectVariants({ variant })
                                            )}
                                            style={{ animationDuration: `${animation}s` }}
                                        >
                                            {option?.label}
                                            <XCircle
                                                className="ml-2 h-4 w-4 cursor-pointer"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    toggleOption(value);
                                                }}
                                            />
                                        </Badge>
                                    );
                                })}
                                {selectedValues.length > maxCount && (
                                    <Badge
                                        className={cn(
                                            "bg-transparent text-foreground border-foreground/1 hover:bg-transparent",
                                            isAnimating ? "animate-bounce" : "",
                                            multiSelectVariants({ variant })
                                        )}
                                        style={{ animationDuration: `${animation}s` }}
                                    >
                                        {`+ ${selectedValues.length - maxCount} more`}
                                        <XCircle
                                            className="ml-2 h-4 w-4 cursor-pointer"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                clearExtraOptions();
                                            }}
                                        />
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <XIcon
                                    className="h-4 mx-2 cursor-pointer text-muted-foreground"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleClear();
                                    }}
                                />
                                <Separator
                                    orientation="vertical"
                                    className="flex min-h-6 h-full"
                                />
                                <ChevronDown className="h-4 mx-2 cursor-pointer text-muted-foreground" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between w-full mx-auto">
                            <span className="text-sm text-muted-foreground mx-3">
                                {placeholder}
                            </span>
                            <ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 popover-content-width-full"
                align="start"
                onEscapeKeyDown={() => setIsPopoverOpen(false)}
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={placeholder}
                        onKeyDown={handleInputKeyDown}
                        onValueChange={(value) => setSearchTerm(value)}
                    />
                    <CommandList onScroll={handleScroll}>
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
                                <CommandItem
                                    key="all"
                                    onSelect={toggleAll}
                                    className="cursor-pointer"
                                >
                                    <div
                                        className={cn(
                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                            selectedValues.length === items.length
                                                ? "bg-primary text-primary-foreground"
                                                : "opacity-50 [&_svg]:invisible"
                                        )}
                                    >
                                        <CheckIcon className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold">&#40;Chọn tất cả&#41;</span>
                                </CommandItem>
                                {items.map((option) => {
                                    const isSelected = selectedValues.includes(option.value);
                                    return (
                                        <CommandItem
                                            key={option.value}
                                            onSelect={() => toggleOption(option.value)}
                                            className="cursor-pointer"
                                        >
                                            <div
                                                className={cn(
                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground"
                                                        : "opacity-50 [&_svg]:invisible"
                                                )}
                                            >
                                                <CheckIcon className="h-4 w-4" />
                                            </div>
                                            <span>{option.label}</span>
                                        </CommandItem>
                                    );
                                })}
                                {isFetchingNextPage && (
                                    <CommandItem>
                                        <Loader2 className='animate-spin' />
                                    </CommandItem>
                                )}
                            </CommandGroup>
                        ) : (<CommandEmpty>{emptyText}</CommandEmpty>)}
                    </CommandList>
                    <CommandGroup>
                        <div className="flex items-center justify-between">
                            {selectedValues.length > 0 && (
                                <>
                                    <CommandItem
                                        onSelect={handleClear}
                                        className="flex-1 justify-center cursor-pointer"
                                    >
                                        Xóa hết
                                    </CommandItem>
                                    <Separator
                                        orientation="vertical"
                                        className="flex min-h-6 h-full"
                                    />
                                </>
                            )}
                            <CommandItem
                                onSelect={() => setIsPopoverOpen(false)}
                                className="flex-1 justify-center cursor-pointer max-w-full"
                            >
                                Đóng
                            </CommandItem>
                        </div>
                    </CommandGroup>
                </Command>
            </PopoverContent>
            {animation > 0 && selectedValues.length > 0 && (
                <WandSparkles
                    className={cn(
                        "cursor-pointer my-2 text-foreground bg-background w-3 h-3",
                        isAnimating ? "" : "text-muted-foreground"
                    )}
                    onClick={() => setIsAnimating(!isAnimating)}
                />
            )}
        </Popover>
    );
}