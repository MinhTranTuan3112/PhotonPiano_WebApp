import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { Calendar1, CircleUserRound, DoorClosed, DoorOpen, LayoutDashboard, Pen, Settings, User, WalletCards } from "lucide-react";
import React from "react";
import NotificationBell from "~/components/notification/notification-bell";
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
import { requireAuth } from "~/lib/utils/auth";

export async function loader({ request }: LoaderFunctionArgs) {

    const { accountId } = await requireAuth(request);

    return { accountId }
}

function getBreadcrumbPageName({ pathname }: {
    pathname: string,
}): BreadcumbNavItem[] {
    const defaultNavItem = {
        name: "Management",
        url: "/admin",
    };

    let otherNavItems: BreadcumbNavItem[] = []
    switch (true) {
        case pathname === '/admin/settings':
            otherNavItems = [
                {
                    name: "Settings",
                    url: '/admin/settings',
                    isCurrentPage: true
                },
            ]
            break;
        case pathname.startsWith('/admin/levels'):
            const levelParam = pathname.replace('/admin/levels', "");
            otherNavItems = [
                {
                    name: "Manage Levels",
                    url: '/admin/levels',
                    isCurrentPage: levelParam.length === 0
                },
            ]

            if (levelParam.length > 1) {
                otherNavItems.push({
                    name: "Level Details",
                    url: pathname,
                    isCurrentPage: true
                })
            }

            break;
        case pathname === '/admin/criteria':
            otherNavItems = [
                {
                    name: "Manage Criteria",
                    url: '/admin/criteria',
                    isCurrentPage: true
                },
            ]
            break;
        case pathname === '/admin/rooms':
            otherNavItems = [
                {
                    name: "Manage Rooms",
                    url: '/admin/rooms',
                    isCurrentPage: true
                },
            ]
            break;
        case pathname === '/admin/day-offs':
            otherNavItems = [
                {
                    name: "Manage Day-Offs",
                    url: '/admin/day-offs',
                    isCurrentPage: true
                },
            ]
            break;
        case pathname === '/admin/profile':
            otherNavItems = [
                {
                    name: "Personal Info",
                    url: '/admin/profile',
                    isCurrentPage: true
                },
            ]
            break;
        case pathname === '/admin/dashboard':
            otherNavItems = [
                {
                    name: "Dashboard",
                    url: '/admin/dashboard',
                    isCurrentPage: true
                },
            ]
            break;
        case pathname === '/admin/accounts':
            otherNavItems = [
                {
                    name: "Manage Accounts",
                    url: '/admin/accounts',
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
    const { accountId } = useLoaderData<typeof loader>()

    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex place-content-between w-full">
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
                        <div className="mr-4">
                            <NotificationBell accountFirebaseId={accountId} />
                        </div>
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
            title: "General",
            url: "",
            icon: CircleUserRound,
            isActive: true,
            items: [
                {
                    title: "Personal Info",
                    url: "/admin/profile",
                }
            ],
        },
        {
            title: "Statistic",
            url: "/admin/dashboard",
            icon: LayoutDashboard,
            isActive: true,
        },
        {
            title: "Levels",
            url: "/admin/levels",
            icon: Settings,
            isActive: true,
        },
        {
            title: "Accounts",
            url: "/admin/accounts",
            icon: User,
            isActive: true,
        },
        {
            title: "Criteria",
            url: "/admin/criteria",
            icon: Pen,
            isActive: true,
        },
        {
            title: "Rooms",
            url: "/admin/rooms",
            icon: DoorClosed,
            isActive: true,
        },
        {
            title: "Day-Offs",
            url: "/admin/day-offs",
            icon: Calendar1,
            isActive: true,
        },
        {
            title: "Transactions",
            url: "/admin/transactions",
            icon: WalletCards,
            isActive: true,
        },
        {
            title: "Settings",
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