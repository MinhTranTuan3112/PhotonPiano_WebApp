import { Piano } from "lucide-react"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "../ui/sidebar"
import { Link, useNavigate } from "@remix-run/react";

type Props = {

};

export default function TopNav({ }: Props) {


    const navigate = useNavigate();

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton size="lg"
                    onClick={() => navigate('/')}
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    <Link className="flex justify-center items-center space-x-3" to={'/'}>
                        <div className="relative">
                            <Piano className="size-5 text-indigo-600 animate-pulse" />
                            <div className="absolute -top-1 -right-1 h-2 w-2 bg-teal-400 rounded-full animate-bounce" />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">Photon Piano</h1>
                    </Link>
                </SidebarMenuButton>
                {/* <DropdownMenu>
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
                </DropdownMenu> */}
            </SidebarMenuItem>
        </SidebarMenu>
    )
}