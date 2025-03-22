import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { ColumnDef } from "@tanstack/react-table";
import {  SurveyQuestion } from "~/lib/types/survey-question/survey-question";
import { Checkbox } from "../ui/checkbox";
import { DataTable } from "../ui/data-table";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "~/hooks/use-debounce";
import { fetchSurveyQuestions } from "~/lib/services/survey-question";
import { PaginationMetaData } from "~/lib/types/pagination-meta-data";
import { PagedResult } from "~/lib/types/query/paged-result";
import { Skeleton } from "../ui/skeleton";
import { Loader2 } from "lucide-react";

export type QuestionsListDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onQuestionsAdded: (questions: SurveyQuestion[]) => void;
    idToken: string;
}


export default function QuestionsListDialog({
    isOpen,
    setIsOpen,
    onQuestionsAdded,
    idToken
}: QuestionsListDialogProps) {

    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [isPreloading, setIsPreloading] = useState(true);
    const debouncedSearchTerm = useDebounce(searchTerm, isPreloading ? 0 : 300);

    const { data, isLoading: isLoadingQuestions, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
        useInfiniteQuery({
            queryKey: ['questions', debouncedSearchTerm],
            queryFn: async ({ pageParam = 1 }) => {
                const response = await fetchSurveyQuestions({ keyword: debouncedSearchTerm, page: pageParam, pageSize: 10, idToken });

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
                } as PagedResult<SurveyQuestion>;

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

    const fetchedData: SurveyQuestion[] = data?.pages.flatMap(item => item.data) || [];

    const [selectedQuestions, setSelectedQuestions] = useState<SurveyQuestion[]>([]);

    useEffect(() => {

        setIsPreloading(false);

        return () => {

        }

    }, []);


    const columns: ColumnDef<SurveyQuestion>[] = [
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
                        setSelectedQuestions(value ? fetchedData : [])
                    }}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    variant={'theme'}
                    checked={row.getIsSelected() || selectedQuestions.some(question => question.id === row.original.id)}
                    onCheckedChange={(value) => {
                        row.toggleSelected(!!value)
                        if (value) {
                            setSelectedQuestions([...selectedQuestions, row.original])
                        } else {
                            setSelectedQuestions(selectedQuestions.filter(question => question.id !== row.original.id))
                        }
                    }}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'Nội dung câu hỏi',
            header: 'Nội dung câu hỏi',
            cell: ({ row }) => {
                return <div className="font-bold">{row.original.questionContent}</div>
            }
        },
        {
            accessorKey: 'Các lựa chọn',
            header: 'Các lựa chọn',
            cell: ({ row }) => {
                return <div className="flex flex-col gap-1">
                    {row.original.options.length === 0 ? "Không có lựa chọn" : row.original.options.map((option, index) => (
                        <div className="" key={index}>
                            {option}
                        </div>
                    ))}
                </div>
            }
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen} >
            <DialogContent className="min-w-[1000px]">
                <DialogHeader className="w-full">
                    <DialogTitle>Thêm câu hỏi từ ngân hàng câu hỏi</DialogTitle>
                    <DialogDescription>
                        Chọn câu hỏi từ ngân hàng câu hỏi để thêm vào bài khảo sát hiện tại.
                    </DialogDescription>
                </DialogHeader>
                <Input placeholder="Nhập nội dung câu hỏi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <ScrollArea className="h-80 w-full px-3" onScroll={handleScroll}>
                    {isLoadingQuestions ? <LoadingSkeleton /> : <DataTable
                        enablePagination={false}
                        columns={columns}
                        data={fetchedData}
                        emptyContent={'Không có câu hỏi nào.'}
                        enableColumnDisplayOptions={false}
                    />}
                    {isFetchingNextPage && (
                        <Loader2 className='animate-spin w-full' />
                    )}
                </ScrollArea>
                <DialogFooter>
                    <Button type="button" onClick={() => {
                        onQuestionsAdded(selectedQuestions)
                        setSelectedQuestions([])
                        setIsOpen(false)
                    }} disabled={selectedQuestions.length === 0}>
                        Nhập câu hỏi &#40;{selectedQuestions.length}&#41;
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}