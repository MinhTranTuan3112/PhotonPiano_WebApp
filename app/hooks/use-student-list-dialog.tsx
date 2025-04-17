import { useState } from "react";
import StudentListDialog, { StudentListDialogProps } from "~/components/entrance-tests/student-list-dialog";

type Props = {

} & Omit<StudentListDialogProps, 'isOpen' | 'setIsOpen'>;

export function useStudentListDialog({ ...props }: Props) {

    const [isOpen, setIsOpen] = useState(false);

    const dialog = (
        <StudentListDialog isOpen={isOpen} setIsOpen={setIsOpen} {...props} />
    );

    return {
        isOpen,
        handleOpen: () => setIsOpen(true),
        studentsListDialog: dialog
    }
}