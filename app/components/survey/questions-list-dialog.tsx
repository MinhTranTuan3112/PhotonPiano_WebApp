import { Form } from "@remix-run/react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { ColumnDef } from "@tanstack/react-table";
import { sampleSurveyQuestions, SurveyQuestion } from "~/lib/types/survey-question/survey-question";
import { Checkbox } from "../ui/checkbox";
import { DataTable } from "../ui/data-table";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { useState } from "react";

export type QuestionsListDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onQuestionsAdded: (questions: SurveyQuestion[]) => void;
}

export default function QuestionsListDialog({
    isOpen,
    setIsOpen,
    onQuestionsAdded
}: QuestionsListDialogProps) {

    const [selectedQuestions, setSelectedQuestions] = useState<SurveyQuestion[]>([]);

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
                        setSelectedQuestions(value ? sampleSurveyQuestions : [])
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
                <Input placeholder="Nhập nội dung câu hỏi..." />
                <ScrollArea className="h-80 w-full px-3">
                    <DataTable
                        columns={columns}
                        data={sampleSurveyQuestions}
                        emptyContent={'Không có câu hỏi'}
                        enableColumnDisplayOptions={false}
                    />
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

