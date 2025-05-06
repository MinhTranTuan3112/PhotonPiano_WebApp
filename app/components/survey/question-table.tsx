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
import { toastWarning } from "~/lib/utils/toast-utils";


function QuestionTypeBadge({ type }: { type: QuestionType }) {
    return <Badge variant={'outline'}>{QUESTION_TYPES[type]}</Badge>
}

export const columns: ColumnDef<SurveyQuestion>[] = [
    {
        accessorKey: 'Question content',
        header: 'Question content',
        cell: ({ row }) => {
            return <div className="font-bold">{row.original.questionContent}</div>
        }
    },
    {
        accessorKey: 'Type',
        header: 'Type',
        cell: ({ row }) => {
            return <div className="">
                <QuestionTypeBadge type={row.original.type} />
            </div>
        }
    },
    {
        accessorKey: 'Options',
        header: 'Options',
        cell: ({ row }) => {
            return <div className="">
                {row.original.options.length > 0 ? row.original.options.map((option, index) => {
                    return <div key={index} className="">{option}</div>
                }) : 'Không có lựa chọn'}
            </div>
        }
    },
    {
        accessorKey: 'Allow other answer',
        header: 'Allow other answer',
        cell: ({ row }) => {
            return <div className="">{row.original.allowOtherAnswer ? <Check className="text-green-600" /> : <CircleX className="text-red-600" />}</div>
        }
    },
    {
        accessorKey: 'Age constraint',
        header: 'Age constraint',
        cell: ({ row }) => {
            return <div className="">
                {row.original.minAge ? `From ${row.original.minAge}` : ''} {row.original.maxAge ? ` to ${row.original.maxAge}` : '(None)'}
            </div>
        }
    },
    {
        id: 'Actions',
        accessorKey: 'Actions',
        header: 'Actions',
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
        title: 'Confirm action',
        description: 'Delete this question?',
        onConfirm: () => {
            const formData = new FormData();
            formData.append('id', row.original.id);
            fetcher.submit(formData, {
                method: 'POST',
                action: '/delete-question'
            });
        },
        confirmButtonClassname: 'bg-red-600 text-white',
        confirmText: 'Delete'
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
            toast.success('Delete success.');
            return;
        }

        if (fetcher.data?.success === false) {
            toastWarning(fetcher.data.error);
            return
        }


        return () => {

        }

    }, [fetcher.data]);

    return <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Actions</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    handleOpenQuestionDialog();
                }}>
                    <PencilLine />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleOpenConfirmDialog}>
                    <CircleX />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        {confirmDialog}
        {questionDialog}
    </>
}