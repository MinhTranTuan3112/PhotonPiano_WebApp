import * as React from "react"
import {
    BookOpen,
    CircleUserRound,
} from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "../ui/sidebar"
import TopNav from "./top-nav"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"


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
                    title: "Personal profile",
                    url: "/staff/profile",
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
                    url: "/staff/scheduler",
                },
                {
                    title: "Manage tests",
                    url: "/staff/entrance-tests",
                },
                {
                    title: "Manage learners",
                    url: "/staff/students",
                },
                {
                    title: "Manage teachers",
                    url: "/staff/teachers",
                },
                {
                    title: "Manage classes",
                    url: "/staff/classes",
                },
                {
                    title: 'Auto arrange classes',
                    url: '/staff/auto-arrange-class',
                },
                {
                    title: 'Academic applications',
                    url: '/staff/applications',
                },
                {
                    title: 'Piano surveys',
                    url: '/staff/surveys'
                },
                {
                    title: 'Survey questions',
                    url: '/staff/survey-questions'
                },
                {
                    title: 'News',
                    url: '/staff/articles'
                }
            ],
        }
    ]
}

type Props = {

} & React.ComponentProps<typeof Sidebar>;

export function StaffSidebar({ ...props }: Props) {

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