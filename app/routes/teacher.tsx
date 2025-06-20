import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { BookOpen, CircleUserRound } from "lucide-react";
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
        name: "Manage",
        url: "/teacher/scheduler",
    };
    let otherNavItems: BreadcumbNavItem[] = []
    switch (true) {
        case pathname === '/teacher/profile':
            otherNavItems = [
                {
                    name: "Profile",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        case pathname === '/teacher/classes':
            otherNavItems = [
                {
                    name: "Classes",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        // case pathname === '/teacher/applications':
        //     otherNavItems = [
        //         {
        //             name: "Danh sách đơn từ",
        //             url: pathname,
        //             isCurrentPage: true
        //         }
        //     ]
        //     break;
        case pathname.startsWith('/teacher/entrance-tests'):
            const param = pathname.replace('/teacher/entrance-tests', "")
            otherNavItems = [
                {
                    name: "Entrance tests",
                    url: '/teacher/entrance-tests',
                    isCurrentPage: param.length === 0
                }
            ]
            if (param.length > 1) {
                otherNavItems.push({
                    name: "Test details",
                    url: pathname,
                    isCurrentPage: true
                })
            }
            break;

        case pathname.startsWith('/teacher/scheduler'):
            const attendanceParam = pathname.replace('/teacher/scheduler', "")
            otherNavItems = [
                {
                    name: "My teaching schedule",
                    url: '/teacher/scheduler',
                    isCurrentPage: attendanceParam.length === 0
                }
            ]
            if (attendanceParam.length > 1) {
                otherNavItems.push({
                    name: "Class attendance details",
                    url: pathname,
                    isCurrentPage: true
                })
            }
            break;

        case pathname.startsWith('/teacher/attendance'):
            const attendanceParam3 = pathname.replace('/teacher/attendance', "")
            otherNavItems = [
                {
                    name: "Attendance",
                    url: '/teacher/attendance',
                    isCurrentPage: attendanceParam3.length === 0
                }
            ]
            if (attendanceParam3.length > 1) {
                otherNavItems.push({
                    name: "Detailed attendance information in class",
                    url: pathname,
                    isCurrentPage: true
                })
            }
            break;

        default:
            break;
    }

    return [
        defaultNavItem,
        ...otherNavItems
    ]
}

export default function TeacherLayout() {

    const { pathname } = useLocation();
    const {accountId} = useLoaderData<typeof loader>()


    return (
        <SidebarProvider>
            <TeacherSidebar />
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
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "https://github.com/shadcn.png",
    },
    navMain: [
        {
            title: "General",
            url: "",
            icon: CircleUserRound,
            isActive: true,
            items: [
                {
                    title: "Profile",
                    url: "/teacher/profile",
                }
            ],
        },
        {
            title: "Academic",
            url: "",
            icon: BookOpen,
            isActive: true,
            items: [
                {
                    title: "Schedule",
                    url: "/teacher/scheduler",
                },
                {
                    title: "Tests",
                    url: "/teacher/entrance-tests",
                },
                {
                    title: "Classes",
                    url: "/teacher/classes",
                },
                {
                    title: "Attendance",
                    url: "/teacher/attendance",
                },

            ],
        }
    ]
}


type Props = {

} & React.ComponentProps<typeof Sidebar>;

export function TeacherSidebar({ ...props }: Props) {

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