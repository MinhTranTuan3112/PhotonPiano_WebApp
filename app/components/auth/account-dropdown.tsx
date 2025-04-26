import { useFetcher, useNavigate } from "@remix-run/react";
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
import { useAuth } from "~/lib/contexts/auth-context";
import { Skeleton } from "../ui/skeleton";
import { Role } from "~/lib/types/account/account";


type Props = {}

export default function AccountDropdown({ accountFirebaseId, role }: { accountFirebaseId: string, role: Role }) {

    const fetcher = useFetcher<typeof action>();

    const { currentAccount } = useAuth();

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm signout?',
        description: 'Sign out now?',
        onConfirm: () => {
            fetcher.submit(null, {
                method: 'POST',
                action: '/sign-out',
            });
        },
        confirmText: 'Sign out',
    });

    const navigate = useNavigate()

    return (
        <>
            <div className="flex flex-row gap-5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="cursor-pointer border-[3px] border-gray-300 border-solid ">
                            <AvatarImage src={currentAccount?.avatarUrl ? currentAccount.avatarUrl : "/images/noavatar.png"} alt="@shadcn" />
                            <AvatarFallback>
                                <Skeleton className="rounded-full" />
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Hello, {currentAccount?.fullName || currentAccount?.userName}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => {
                                switch (role) {
                                    case Role.Administrator:
                                        navigate("/admin/settings");
                                        break;
                                    case Role.Student:
                                        navigate("/account/scheduler");
                                        break;
                                    case Role.Instructor:
                                        navigate("/teacher/scheduler");
                                        break;
                                    case Role.Staff:
                                        navigate("/staff/scheduler");
                                        break;
                                }
                            }}>
                                Manage information
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => handleOpenModal()} disabled={isSubmitting}
                                className="cursor-pointer">
                                <LogOut /> Sign out
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                <NotificationBell accountFirebaseId={accountFirebaseId} />
            </div>
            {confirmDialog}
        </>
    )
}