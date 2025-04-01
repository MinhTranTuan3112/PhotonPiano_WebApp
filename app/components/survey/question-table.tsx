import { useFetcher, useRouteLoaderData } from "@remix-run/react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { QuestionType, SurveyQuestion } from "~/lib/types/survey-question/survey-question";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Check, CircleX, MoreHorizontal, PencilLine } from "lucide-react";
import { Badge } from "../ui/badge";
import { QUESTION_TYPES } from "~/lib/utils/constants";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { action } from "~/routes/delete-question";
import { useEffect } from "react";
import { toast } from "sonner";
import { useQuestionDialog } from "~/hooks/use-question-dialog";
import { loader } from "~/root";


function QuestionTypeBadge({ type }: { type: QuestionType }) {
    return <Badge variant={'outline'}>{QUESTION_TYPES[type]}</Badge>
}

export const columns: ColumnDef<SurveyQuestion>[] = [
    {
        accessorKey: 'Nội dung câu hỏi',
        header: 'Nội dung câu hỏi',
        cell: ({ row }) => {
            return <div className="font-bold">{row.original.questionContent}</div>
        }
    },
    {
        accessorKey: 'Loại câu hỏi',
        header: 'Loại câu hỏi',
        cell: ({ row }) => {
            return <div className="">
                <QuestionTypeBadge type={row.original.type} />
            </div>
        }
    },
    {
        accessorKey: 'Các lựa chọn',
        header: 'Các lựa chọn',
        cell: ({ row }) => {
            return <div className="">
                {row.original.options.length > 0 ? row.original.options.map((option, index) => {
                    return <div key={index} className="">{option}</div>
                }) : 'Không có lựa chọn'}
            </div>
        }
    },
    {
        accessorKey: 'Cho phép câu trả lời khác',
        header: (header) => {
            return <div className="max-w-10">Cho phép câu trả lời khác</div>
        },
        cell: ({ row }) => {
            return <div className="">{row.original.allowOtherAnswer ? <Check className="text-green-600" /> : <CircleX className="text-red-600" />}</div>
        }
    },
    {
        accessorKey: 'Giới hạn độ tuổi',
        header: 'Giới hạn độ tuổi',
        cell: ({ row }) => {
            return <div className="">
                {row.original.minAge ? `Từ ${row.original.minAge} tuổi` : ''} {row.original.maxAge ? ` đến ${row.original.maxAge} tuổi` : '(Không)'}
            </div>
        }
    },
    {
        id: 'Thao tác',
        accessorKey: 'Thao tác',
        header: 'Thao tác',
        cell: ({ row }) => {
            return <ActionDropdown row={row} />
        }
    }
]

function ActionDropdown({ row }: {
    row: Row<SurveyQuestion>
}) {

    const fetcher = useFetcher<typeof action>();

    const loaderData = useRouteLoaderData<typeof loader>("root");

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận xóa câu hỏi',
        description: 'Bạn có chắc chắn muốn xóa câu hỏi này không?',
        onConfirm: () => {
            const formData = new FormData();
            formData.append('id', row.original.id);
            fetcher.submit(formData, {
                method: 'POST',
                action: '/delete-question'
            });
        },
        confirmButtonClassname: 'bg-red-600 text-white',
        confirmText: 'Xóa'
    });

    const { isOpen: isQuestionDialogOpen, handleOpen: handleOpenQuestionDialog, questionDialog } = useQuestionDialog({
        onQuestionCreated: (questionData) => {
            console.log({ questionData });
        },
        requiresUpload: true,
        requiresAgeInputs: true,
        isEditing: true,
        requiresAnswersDataDisplay: true,
        idToken: loaderData.idToken || '',
        ...row.original
    });

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Câu hỏi đã được xóa thành công.');
            return;
        }

        if (fetcher.data?.success === false) {
            toast.error(fetcher.data.error);
            return
        }


        return () => {

        }

    }, [fetcher.data]);

    return <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Thao tác</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    handleOpenQuestionDialog();
                }}>
                    <PencilLine />
                    Sửa
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleOpenConfirmDialog}>
                    <CircleX />
                    Xóa
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        {confirmDialog}
        {questionDialog}
    </>
}