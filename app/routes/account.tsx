import { Outlet, useLocation } from "@remix-run/react";
import { AppSidebar } from "~/components/sidebar/app-sidebar";
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

function getBreadcrumbPageName(pathname: string): BreadcumbNavItem[] {
    const defaultNavItem = {
        name: "Quản lý thông tin",
        url: "/account/profile",
    };
    let otherNavItems: BreadcumbNavItem[] = []
    switch (true) {
        case pathname === '/account/profile':
            otherNavItems = [
                {
                    name: "Thông tin cá nhân",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        case pathname === '/account/class':
            otherNavItems = [
                {
                    name: "Lớp của tôi",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
            case pathname === '/account/transactions':
                otherNavItems = [
                    {
                        name: "Lịch sử giao dịch",
                        url: pathname,
                        isCurrentPage: true
                    }
                ]
                break;
        case pathname.startsWith('/account/my-exams'):
            const param = pathname.replace('/account/my-exams', "")
            otherNavItems = [
                {
                    name: "Các bài thi của tôi",
                    url: '/account/my-exams',
                    isCurrentPage: param.length === 0
                }
            ]
            if (param.length > 1) {
                otherNavItems.push({
                    name: "Chi tiết bài thi",
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

export default function AccountLayout() {

    const { pathname } = useLocation();

    return (
        <SidebarProvider className="">
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1 size-5" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {
                                    getBreadcrumbPageName(pathname).map(breadcumb => (
                                        <>
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
                                        </>
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