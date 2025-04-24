import {
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    CreditCard,
    LogOut,
} from "lucide-react"

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "../ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { useAuth } from "~/lib/contexts/auth-context"
import { Skeleton } from "../ui/skeleton"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import { useFetcher } from "@remix-run/react"
import { action } from "~/routes/sign-out"

export function NavUser({

}: {

    }) {
    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm sign out?',
        description: 'Do you want to sign out?',
        onConfirm: () => {
            fetcher.submit(null, {
                method: 'POST',
                action: '/sign-out',
            });
        },
        confirmText: 'Sign out',
    });

    const { isMobile } = useSidebar();

    const { currentAccount } = useAuth();

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={currentAccount?.avatarUrl ? currentAccount.avatarUrl : "/images/noavatar.png"} alt={currentAccount?.userName} />
                                <AvatarFallback className="rounded-lg">
                                    <Skeleton className="rounded-full" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{currentAccount?.fullName || currentAccount?.userName}</span>
                                <span className="truncate text-xs">{currentAccount?.email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="start"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={currentAccount?.avatarUrl ? currentAccount.avatarUrl : "/images/noavatar.png"} alt={currentAccount?.userName} />
                                    <AvatarFallback className="rounded-lg">
                                        <Skeleton className="rounded-full" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{currentAccount?.fullName || currentAccount?.userName}</span>
                                    <span className="truncate text-xs">{currentAccount?.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <BadgeCheck />
                                Account
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <CreditCard />
                                Billing
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Bell />
                                Notifications
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleOpenModal()} disabled={isSubmitting}>
                            <LogOut />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
            {confirmDialog}
        </SidebarMenu>
    )
}