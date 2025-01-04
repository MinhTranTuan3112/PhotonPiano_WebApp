
import * as React from "react"
import { ChevronsUpDown, GalleryVerticalEnd, Home, Piano } from "lucide-react"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar
} from "../ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "../ui/dropdown-menu"
import { useNavigate } from "@remix-run/react";

type Props = {

};

export default function TopNav({}: Props) {

    const { isMobile } = useSidebar()

    const navigate = useNavigate();

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <Piano className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold text-base">
                                   Photon Piano
                                </span>
                                {/* <span className="truncate text-xs">{activeTeam.plan}</span> */}
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Menu
                        </DropdownMenuLabel>
                        <DropdownMenuItem key={'home'} className="gap-2 p-2 cursor-pointer" onClick={() => navigate('/')}>

                            <div className="flex size-6 items-center justify-center rounded-sm border">
                                <Home />
                            </div>
                            Về trang chủ

                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}