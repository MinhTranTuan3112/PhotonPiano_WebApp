import { ReactNode, useCallback, useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "~/components/ui/alert-dialog";
import { ButtonVariant, buttonVariants } from "~/components/ui/button";

type Props = {
    defaultOpen?: boolean;
    title?: string;
    description: string;
    onConfirm: () => void;
    onCancel?: () => void;
    cancelText?: string;
    confirmText?: string;
    cancelButtonClassname?: string;
    confirmButtonVariant?: ButtonVariant;
    confirmButtonClassname?: string;
    content? : ReactNode;
};

export function useConfirmationDialog({ title = 'Confirm', description, onConfirm, onCancel,
    defaultOpen = false,
    cancelText = 'Cancel',
    confirmText = 'Confirm',
    cancelButtonClassname,
    confirmButtonVariant = 'theme',
    confirmButtonClassname,
    content
}: Props) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const open = useCallback(() => setIsOpen(true), []);

    const handleCancel = useCallback(() => {
        setIsOpen(false)
        onCancel?.();
    }, [onCancel]);

    const handleConfirm = useCallback(() => {
        setIsOpen(false)
        onConfirm()
    }, [onConfirm]);

    const ConfirmDialog = (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                {content}
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel} className={cancelButtonClassname ||
                        buttonVariants({ variant: 'outline' })
                    }>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} className={
                        confirmButtonClassname ||
                        buttonVariants({ variant: confirmButtonVariant || 'theme' })
                    }>{confirmText}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return { open, dialog: ConfirmDialog };

}