import { Outlet, useLocation } from "@remix-run/react";
import { BookOpen, CircleUserRound } from "lucide-react";
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
        url: "/staff/dashboard",
    };
    let otherNavItems: BreadcumbNavItem[] = []
    switch (true) {
        case pathname === '/teacher/profile':
            otherNavItems = [
                {
                    name: "Thông tin cá nhân",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        case pathname === '/teacher/classes':
            otherNavItems = [
                {
                    name: "Danh sách lớp",
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
                    name: "Quản lý thi đầu vào",
                    url: '/teacher/entrance-tests',
                    isCurrentPage: param.length === 0
                }
            ]
            if (param.length > 1) {
                otherNavItems.push({
                    name: "Chi tiết ca thi",
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

    console.log({ pathname });


    return (
        <SidebarProvider>
            <TeacherSidebar />
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
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "https://github.com/shadcn.png",
    },
    navMain: [
        {
            title: "Thông tin chung",
            url: "",
            icon: CircleUserRound,
            isActive: true,
            items: [
                {
                    title: "Thông tin cá nhân",
                    url: "/teacher/profile",
                }
            ],
        },
        {
            title: "Quản lý đào tạo",
            url: "",
            icon: BookOpen,
            isActive: true,
            items: [
                {
                    title: "Lịch dạy của tôi",
                    url: "/teacher/scheduler",
                },
                {
                    title: "Quản lý thi đầu vào",
                    url: "/teacher/entrance-tests",
                },
                {
                    title: "Danh sách lớp",
                    url: "/teacher/classes",
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