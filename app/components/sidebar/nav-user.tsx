import { ChevronsUpDown, LogOut } from "lucide-react"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "../ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { useAuth } from "~/lib/contexts/auth-context"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import { useFetcher } from "@remix-run/react"
import type { action } from "~/routes/sign-out"
import { LevelBadge } from "../staffs/table/student-columns"
import { useState, useEffect } from "react"

export function NavUser() {
    const fetcher = useFetcher<typeof action>()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const isSubmitting = fetcher.state === "submitting"

    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: "Confirm sign out?",
        description: "Do you want to sign out?",
        onConfirm: () => {
            fetcher.submit(null, {
                method: "POST",
                action: "/sign-out",
            })
        },
        confirmText: "Sign out",
    })

    const { isMobile, state: sidebarState } = useSidebar()
    const { currentAccount } = useAuth()

    useEffect(() => {
        setIsDropdownOpen(false)
    }, [sidebarState])

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    src={currentAccount?.avatarUrl ? currentAccount.avatarUrl : "/images/noavatar.png"}
                                    alt={currentAccount?.userName}
                                />
                                <AvatarFallback className="rounded-lg">
                                    {currentAccount?.fullName ? currentAccount.fullName.charAt(0).toUpperCase() : "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{currentAccount?.fullName || currentAccount?.userName}</span>
                                <span className="truncate text-xs italic">{currentAccount?.email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="start"
                        sideOffset={4}
                        alignOffset={0}
                        avoidCollisions={true}
                        collisionPadding={8}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={currentAccount?.avatarUrl ? currentAccount.avatarUrl : "/images/noavatar.png"}
                                        alt={currentAccount?.userName}
                                    />
                                    <AvatarFallback className="rounded-lg">
                                        {currentAccount?.fullName ? currentAccount.fullName.charAt(0).toUpperCase() : "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-1 text-left text-sm leading-tight">
                                    <span className="font-semibold">{currentAccount?.fullName || currentAccount?.userName}</span>
                                    <span className="truncate text-xs italic">{currentAccount?.email}</span>
                                </div>
                            </div>
                            {currentAccount?.levelId && (
                                <div className="w-full mb-3 px-1">
                                    <LevelBadge level={currentAccount.level} />
                                </div>
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onClick={handleOpenModal} disabled={isSubmitting}>
                            <LogOut className="mr-2 h-4 w-4" />
                            {isSubmitting ? "Signing out..." : "Sign out"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
            {confirmDialog}
        </SidebarMenu>
    )
}
