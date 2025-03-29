import { useState } from "react";
import ImportResultDialog, { ImportResultDialogProps } from "~/components/entrance-tests/import-result-dialog";


type Props = {

} & Omit<ImportResultDialogProps, 'isOpen' | 'setIsOpen'>;

export function useImportResultDialog({
    criterias,
    entranceTestStudents
}: Props) {

    const [isOpen, setIsOpen] = useState(false);

    const dialog =(
        <ImportResultDialog
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            criterias={criterias}
            entranceTestStudents={entranceTestStudents}
        />
    );


    return {
        isOpen,
        handleOpen: () => setIsOpen(true),
        importResultDialog: dialog
    }

}