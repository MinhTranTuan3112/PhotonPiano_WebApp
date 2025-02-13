import { useFetcher } from "@remix-run/react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "../ui/dropdown-menu"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { action } from "~/routes/sign-out";
import { LogOut } from "lucide-react";
import NotificationBell from "../notification/notification-bell";

type Props = {}

export default function AccountDropdown({ }: Props) {

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận đăng xuất?',
        description: 'Bạn có chắc chắn muốn đăng xuất?',
        onConfirm: () => {
            fetcher.submit(null, {
                method: 'POST',
                action: '/sign-out',
            });
        },
        confirmText: 'Đăng xuất',
    });

    return (
        <>
            <div className="flex flex-row gap-5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="cursor-pointer border-[3px] border-gray-300 border-solid ">
                            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Xin chào</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem className="cursor-pointer">
                                Quản lý thông tin
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => handleOpenModal()} disabled={isSubmitting}
                                className="cursor-pointer">
                                <LogOut /> Đăng xuất
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                <NotificationBell />
            </div>
            {confirmDialog}
        </>
    )
}