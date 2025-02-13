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
            title: "Thông tin chung",
            url: "",
            icon: CircleUserRound,
            isActive: true,
            items: [
                {
                    title: "Thông tin cá nhân",
                    url: "/info",
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
                    title: "Quản lý lịch thi đầu vào",
                    url: "/staff/entrance-tests",
                },
                {
                    title: "Danh sách học viên",
                    url: "/staff/students",
                },
                {
                    title: "Danh sách lớp",
                    url: "/staff/classes",
                },
                {
                    title: 'Danh sách đơn từ',
                    url: '/staff/applications',
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
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}