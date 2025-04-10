import { Outlet, useLocation } from "@remix-run/react";
import React from "react";
import { StaffSidebar } from "~/components/sidebar/staff-sidebar";
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
    SidebarInset,
    SidebarProvider,
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
        case pathname === '/staff/entrance-tests/create':
            otherNavItems = [
                {
                    name: "Quản lý thi đầu vào",
                    url: '/staff/entrance-tests',
                    isCurrentPage: false
                },
                {
                    name: "Tạo ca thi",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;

        case pathname === '/staff/surveys/create':
            otherNavItems = [
                {
                    name: "Quản lý khảo sát",
                    url: '/staff/surveys',
                    isCurrentPage: false
                },
                {
                    name: "Tạo khảo sát mới",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        case pathname.startsWith('/staff/surveys'):
            const surveyParam = pathname.replace('/staff/surveys', "")
            otherNavItems = [
                {
                    name: "Quản lý khảo sát",
                    url: '/staff/surveys',
                    isCurrentPage: surveyParam.length === 0
                }
            ]
            if (surveyParam.length > 1) {
                otherNavItems.push({
                    name: "Chi tiết khảo sát",
                    url: pathname,
                    isCurrentPage: true
                })
            }
            break;
        case pathname === '/staff/profile':
            otherNavItems = [
                {
                    name: "Thông tin cá nhân",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        case pathname === '/staff/students':
            otherNavItems = [
                {
                    name: "Danh sách học viên",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        case pathname === '/staff/classes':
            otherNavItems = [
                {
                    name: "Danh sách lớp",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        case pathname === '/staff/applications':
            otherNavItems = [
                {
                    name: "Danh sách đơn từ",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        case pathname === '/staff/survey-questions':
            otherNavItems = [
                {
                    name: "Danh sách câu hỏi khảo sát",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;

        case pathname === '/staff/articles/create':
            otherNavItems = [
                {
                    name: "Quản lý tin tức",
                    url: '/staff/articles',
                    isCurrentPage: false
                },
                {
                    name: "Tạo bài viết mới",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;

        case pathname.startsWith('/staff/articles'):

            const articleParam = pathname.replace('/staff/articles', "");

            otherNavItems = [
                {
                    name: "Quản lý tin tức",
                    url: '/staff/articles',
                    isCurrentPage: pathname === '/staff/articles'
                }
            ]

            if (articleParam.length > 1) {
                otherNavItems.push({
                    name: "Chi tiết bài viết",
                    url: pathname,
                    isCurrentPage: true
                })
            }

            break;
        case pathname.startsWith('/staff/entrance-tests'):
            const param = pathname.replace('/staff/entrance-tests', "")
            otherNavItems = [
                {
                    name: "Quản lý thi đầu vào",
                    url: '/staff/entrance-tests',
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

export default function StaffLayout() {

    const { pathname } = useLocation();

    return (
        <SidebarProvider>
            <StaffSidebar />
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