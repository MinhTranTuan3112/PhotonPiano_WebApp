import { useState } from "react";
import QuestionDialog, { QuestionDialogProps } from "../components/survey/question-dialog";

export function useQuestionDialog({
    ...props
}: {

} & Omit<QuestionDialogProps, 'isOpen' | 'setIsOpen'>) { 

    const [isOpen, setIsOpen] = useState(false);

    const dialog = (
        <QuestionDialog isOpen={isOpen} setIsOpen={setIsOpen} {...props} />
    );

    return {
        isOpen,
        handleOpen: () => setIsOpen(true),
        questionDialog: dialog
    }
}