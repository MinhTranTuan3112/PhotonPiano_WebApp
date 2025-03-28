import React, { useState } from 'react'
import QuestionsListDialog, { QuestionsListDialogProps } from '~/components/survey/questions-list-dialog'

type Props = {

} & Omit<QuestionsListDialogProps, 'isOpen' | 'setIsOpen'>;

export default function useQuestionsListDialog({
    ...props
}: Props) {

    const [isOpen, setIsOpen] = useState(false);

    const dialog = (
        <QuestionsListDialog isOpen={isOpen} setIsOpen={setIsOpen} {...props} />
    );

    return {
        isOpen,
        handleOpen: () => setIsOpen(true),
        questionsListDialog: dialog
    }
}