import { Outlet, useLocation } from "@remix-run/react";
import { Calendar1, CircleUserRound, DoorClosed, DoorOpen, LayoutDashboard, Pen, Settings } from "lucide-react";
import React from "react";
import { NavMain } from "~/components/sidebar/nav-main";
import { NavUser } from "~/components/sidebar/nav-user";
import TopNav from "~/components/sidebar/top-nav";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "~/components/ui/breadcrumb";
import { buttonVariants } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator"; 
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger
} from "~/components/ui/sidebar";
import { BreadcumbNavItem } from "~/lib/types/breadcumb-nav-item";

function getBreadcrumbPageName({ pathname }: {
    pathname: string,
}): BreadcumbNavItem[] {
    const defaultNavItem = {
        name: "Quản lý",
        url: "/admin",
    };

    let otherNavItems: BreadcumbNavItem[] = []
    switch (true) {
        case pathname === '/admin/settings':
            otherNavItems = [
                {
                    name: "Cấu hình hệ thống",
                    url: '/admin/settings',
                    isCurrentPage: true
                },
            ]
            break;
        case pathname === '/admin/levels':
            otherNavItems = [
                {
                    name: "Quản lý level đào tạo",
                    url: '/admin/levels',
                    isCurrentPage: true
                },
            ]
            break;
        case pathname === '/admin/criteria':
            otherNavItems = [
                {
                    name: "Quản lý tiêu chí đánh giá",
                    url: '/admin/criteria',
                    isCurrentPage: true
                },
            ]
            break;
        case pathname === '/admin/rooms':
            otherNavItems = [
                {
                    name: "Quản lý phòng học",
                    url: '/admin/rooms',
                    isCurrentPage: true
                },
            ]
            break;
        case pathname === '/admin/day-offs':
            otherNavItems = [
                {
                    name: "Quản lý ngày nghỉ",
                    url: '/admin/day-offs',
                    isCurrentPage: true
                },
            ]
            break;
        case pathname === '/admin/profile':
            otherNavItems = [
                {
                    name: "Thông tin cá nhân",
                    url: '/admin/profile',
                    isCurrentPage: true
                },
            ]
            break;
        default:
            break;
    }

    return [
        defaultNavItem,
        ...otherNavItems
    ]
}

export default function AdminLayout() {

    const { pathname } = useLocation();

    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1 size-5" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {
                                    getBreadcrumbPageName({ pathname }).map((breadcumb, index) => (
                                        <React.Fragment key={`${breadcumb.name}_${index}`}>
                                            <BreadcrumbItem className="hidden md:block">
                                                {
                                                    !breadcumb.isCurrentPage ? (
                                                        <BreadcrumbLink href={breadcumb.url} className={buttonVariants({ variant: "linkHover2" })}>
                                                            {breadcumb.name}
                                                        </BreadcrumbLink>
                                                    ) : (
                                                        <BreadcrumbPage>{breadcumb.name}</BreadcrumbPage>
                                                    )
                                                }

                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator className="hidden md:block" />
                                        </React.Fragment>
                                    ))
                                }
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <Separator orientation="horizontal" className="border-t border-muted/50" />
                <div className="flex flex-1 flex-col gap-4 py-5">
                    <Outlet />
                    {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        <div className="aspect-video rounded-xl bg-muted/50" />
                        <div className="aspect-video rounded-xl bg-muted/50" />
                        <div className="aspect-video rounded-xl bg-muted/50" />
                    </div>
                    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" /> */}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

const data = {
    navMain: [
        {
            title: "Thông tin chung",
            url: "",
            icon: CircleUserRound,
            isActive: true,
            items: [
                {
                    title: "Thông tin cá nhân",
                    url: "/admin/profile",
                }
            ],
        },
        {
            title: "Thống kê",
            url: "/admin/dashboard",
            icon: LayoutDashboard,
            isActive: true,
        },       
        {
            title: "Quản lý level đào tạo",
            url: "/admin/levels",
            icon: Settings,
            isActive: true,
        },
        {
            title: "Quản lý tiêu chí đánh giá",
            url: "/admin/criteria",
            icon: Pen,
            isActive: true,
        },
        {
            title: "Quản lý phòng học",
            url: "/admin/rooms",
            icon: DoorClosed,
            isActive: true,
        },
        {
            title: "Quản lý ngày nghỉ",
            url: "/admin/day-offs",
            icon: Calendar1,
            isActive: true,
        },
        {
            title: "Cấu hình hệ thống",
            url: "/admin/settings",
            icon: Settings,
            isActive: true,
        },
    ]
}

type AdminSidebarProps = {

} & React.ComponentProps<typeof Sidebar>;

function AdminSidebar({ ...props }: AdminSidebarProps) {

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TopNav />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}