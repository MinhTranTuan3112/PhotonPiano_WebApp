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
                    title: "Lịch học",
                    url: "/staff/scheduler",
                },
                {
                    title: "Quản lý lịch thi",
                    url: "/staff/entrance-tests",
                },
                {
                    title: "Danh sách học viên",
                    url: "/staff/students",
                },
                {
                    title: "Danh sách giảng viên",
                    url: "/staff/teachers",
                },
                {
                    title: "Danh sách lớp",
                    url: "/staff/classes",
                },
                {
                    title: 'Xếp lớp tự động',
                    url: '/staff/auto-arrange-class',
                },
                {
                    title: 'Danh sách đơn từ',
                    url: '/staff/applications',
                },
                {
                    title: 'Quản lý khảo sát',
                    url: '/staff/surveys'
                },
                {
                    title: 'Quản lý câu hỏi khảo sát',
                    url: '/staff/survey-questions'
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