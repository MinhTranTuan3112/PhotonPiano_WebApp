import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, redirect, useLoaderData, useLocation, useRouteLoaderData } from "@remix-run/react";
import React from "react";
import NotificationBell from "~/components/notification/notification-bell";
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
import { useAuth } from "~/lib/contexts/auth-context";
import { BreadcumbNavItem } from "~/lib/types/breadcumb-nav-item";
import { requireAuth } from "~/lib/utils/auth";

export async function loader({ request }: LoaderFunctionArgs) {

  const { accountId } = await requireAuth(request);
  
  return {accountId}
}
function getBreadcrumbPageName({ pathname }: {
    pathname: string,
}): BreadcumbNavItem[] {
    const defaultNavItem = {
        name: "Manage",
        url: "/staff/dashboard",
    };
    let otherNavItems: BreadcumbNavItem[] = []
    switch (true) {
        case pathname === '/staff/entrance-tests/create':
            otherNavItems = [
                {
                    name: "Manage tests",
                    url: '/staff/entrance-tests',
                    isCurrentPage: false
                },
                {
                    name: "Create new test",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;

        case pathname === '/staff/surveys/create':
            otherNavItems = [
                {
                    name: "Manage piano surveys",
                    url: '/staff/surveys',
                    isCurrentPage: false
                },
                {
                    name: "Create new piano survey",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        case pathname.startsWith('/staff/surveys'):
            const surveyParam = pathname.replace('/staff/surveys', "")
            otherNavItems = [
                {
                    name: "Manage piano surveys",
                    url: '/staff/surveys',
                    isCurrentPage: surveyParam.length === 0
                }
            ]
            if (surveyParam.length > 1) {
                otherNavItems.push({
                    name: "Survey details",
                    url: pathname,
                    isCurrentPage: true
                })
            }
            break;
        case pathname === '/staff/profile':
            otherNavItems = [
                {
                    name: "Personal profile",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        case pathname.startsWith('/staff/students'):
            const learnerParam = pathname.replace('/staff/students', "");
            otherNavItems = [
                {
                    name: "Learners",
                    url: '/staff/students',
                    isCurrentPage: learnerParam.length === 0
                }
            ]

            if (learnerParam.length > 1) {
                otherNavItems.push({
                    name: "Learner details",
                    url: pathname,
                    isCurrentPage: true
                })
            }
            break;
        case pathname === '/staff/classes':
            otherNavItems = [
                {
                    name: "Classes",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        case pathname === '/staff/applications':
            otherNavItems = [
                {
                    name: "Academic applications",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        case pathname === '/staff/survey-questions':
            otherNavItems = [
                {
                    name: "Survey questions",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;

        case pathname === '/staff/articles/create':
            otherNavItems = [
                {
                    name: "News Articles",
                    url: '/staff/articles',
                    isCurrentPage: false
                },
                {
                    name: "Create new article",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;

        case pathname.startsWith('/staff/articles'):

            const articleParam = pathname.replace('/staff/articles', "");

            otherNavItems = [
                {
                    name: "News Articles",
                    url: '/staff/articles',
                    isCurrentPage: pathname === '/staff/articles'
                }
            ]

            if (articleParam.length > 1) {
                otherNavItems.push({
                    name: "Article details",
                    url: pathname,
                    isCurrentPage: true
                })
            }

            break;
        case pathname.startsWith('/staff/entrance-tests'):
            const param = pathname.replace('/staff/entrance-tests', "")
            otherNavItems = [
                {
                    name: "Manage Tests",
                    url: '/staff/entrance-tests',
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
        case pathname === '/staff/auto-arrange-class':
            otherNavItems = [
                {
                    name: "Auto Arrange Classes",
                    url: pathname,
                    isCurrentPage: true
                }
            ]
            break;
        case pathname === '/staff/scheduler':
            otherNavItems = [
                {
                    name: "Schedule",
                    url: pathname,
                    isCurrentPage: true
                }
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

export default function StaffLayout() {

    const { pathname } = useLocation();
    const {accountId} = useLoaderData<typeof loader>()

    return (
        <SidebarProvider>
            <StaffSidebar />
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