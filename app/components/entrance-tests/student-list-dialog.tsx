import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDebounce } from "~/hooks/use-debounce";
import { fetchAccounts } from "~/lib/services/account";
import { Account, Role, StudentStatus } from "~/lib/types/account/account";
import { PaginationMetaData } from "~/lib/types/pagination-meta-data";
import { PagedResult } from "~/lib/types/query/paged-result";
import { Skeleton } from "../ui/skeleton";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "../ui/checkbox";
import { StatusBadge } from "../staffs/table/student-columns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { DataTable } from "../ui/data-table";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { EntranceTest } from "~/lib/types/entrance-test/entrance-test";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";

export type StudentListDialogProps = {
    entranceTest: EntranceTest;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onStudentsAdded: (students: Account[]) => void;
    idToken: string;
}

export default function StudentListDialog({ isOpen, setIsOpen, idToken, onStudentsAdded, entranceTest }: StudentListDialogProps) {

    const [searchTerm, setSearchTerm] = useState('');
    const [isPreloading, setIsPreloading] = useState(true);
    const debouncedSearchTerm = useDebounce(searchTerm, isPreloading ? 0 : 300);

    const { data, isLoading: isLoadingStudents, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
        useInfiniteQuery({
            queryKey: ['students', debouncedSearchTerm],
            queryFn: async ({ pageParam = 1 }) => {
                const response = await fetchAccounts({
                    q: debouncedSearchTerm, page: pageParam, pageSize: 10, idToken, roles: [Role.Student],
                    studentStatuses: [StudentStatus.WaitingForEntranceTestArrangement]
                });

                const headers = response.headers;

                const metadata: PaginationMetaData = {
                    page: parseInt(headers['x-page'] || '1'),
                    pageSize: parseInt(headers['x-page-size'] || '10'),
                    totalPages: parseInt(headers['x-total-pages'] || '1'),
                    totalCount: parseInt(headers['x-total-count'] || '0'),
                };

                return {
                    data: await response.data,
                    metadata
                } as PagedResult<Account>;
            },
            getNextPageParam: (lastResult) =>
                lastResult.metadata && lastResult.metadata.page < lastResult.metadata.totalPages
                    ? lastResult.metadata.page + 1
                    : undefined,
            enabled: isOpen, // Automatically fetch when the component is mounted
            initialPageParam: 1,
            refetchOnWindowFocus: false,
        });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollHeight - target.scrollTop === target.clientHeight && hasNextPage) {
            fetchNextPage();
        }
    };

    const fetchedData: Account[] = data?.pages.flatMap(item => item.data) || [];

    const [selectedStudents, setSelectedStudents] = useState<Account[]>([]);

    useEffect(() => {

        setIsPreloading(false);

        return () => {

        }

    }, []);

    const columns: ColumnDef<Account>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    variant={'theme'}
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => {
                        table.toggleAllPageRowsSelected(!!value)
                        setSelectedStudents(value ? fetchedData : [])
                    }}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    variant={'theme'}
                    checked={row.getIsSelected() || selectedStudents.some(student => student.accountFirebaseId === row.original.accountFirebaseId)}
                    onCheckedChange={(value) => {
                        row.toggleSelected(!!value)
                        if (value) {
                            setSelectedStudents([...selectedStudents, row.original])
                        } else {
                            setSelectedStudents(selectedStudents.filter(student => student.accountFirebaseId !== row.original.accountFirebaseId))
                        }
                    }}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'Name',
            header: 'Name',
            cell: ({ row }) => {
                return <div className="font-bold">{row.original.fullName || row.original.userName}</div>
            }
        },
        {
            accessorKey: 'Email',
            header: 'Email',
            cell: ({ row }) => {
                return <div className="font-bold">{row.original.email}</div>
            }
        },
        {
            accessorKey: 'Status',
            header: 'Status',
            cell: ({ row }) => {
                return <div className="">
                    <StatusBadge status={row.original.studentStatus || 0} />
                </div>
            }
        }
    ];

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm adding learners',
        description: `Add ${selectedStudents.length} learners to the test ${entranceTest.name}?`,
        confirmText: 'Add',
        onConfirm: () => {
            onStudentsAdded(selectedStudents)
            setSelectedStudents([])
            setIsOpen(false)
        },
    })

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="min-w-[1000px]">
                    <DialogHeader className="w-full">
                        <DialogTitle>Select learners to add to test <span className="font-bold">{entranceTest.name}</span> </DialogTitle>
                        <DialogDescription>
                            Select learners to add to the test. You can select multiple learners at once.
                            <div className="text-sm text-muted-foreground">Find learners by name, email and phone.</div>
                        </DialogDescription>
                    </DialogHeader>
                    <Input placeholder="Search learners here..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <ScrollArea className="h-80 w-full px-3" onScroll={handleScroll}>
                        {isLoadingStudents ? <LoadingSkeleton /> : <DataTable
                            enablePagination={false}
                            columns={columns}
                            data={fetchedData}
                            emptyContent={'Không có học viên nào.'}
                            enableColumnDisplayOptions={false}
                        />}
                        {isFetchingNextPage && (
                            <Loader2 className='animate-spin w-full' />
                        )}
                    </ScrollArea>
                    <DialogFooter>
                        <Button type="button" onClick={handleOpenConfirmDialog}
                            disabled={selectedStudents.length === 0}>
                            Choose &#40;{selectedStudents.length}&#41; learners
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {confirmDialog}
        </>
    )
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}