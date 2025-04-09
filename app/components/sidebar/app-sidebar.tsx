import * as React from "react"
import {
    CircleUserRound,
    DollarSign,
    FileClock,
    History,
    Music
} from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "../ui/sidebar"
import TopNav from "./top-nav"
import { NavMain } from "./nav-main"
import NavOthers from "./nav-others"
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
                    url: "/account/profile",
                },
                {
                    title: "Khung giờ của bạn",
                    url: "/account/free-slots",
                }
            ],
        },
        {
            title: "Học tập",
            url: "",
            icon: Music,
            isActive: true,
            items: [
                {
                    title: "Lịch học của tôi",
                    url: "/account/scheduler",
                },
                {
                    title: "Lớp của tôi",
                    url: "/account/class",
                },
                {
                    title: "Bài thi của tôi",
                    url: "/account/my-exams",
                },
                
                {
                    title: "Lịch sử đơn từ",
                    url: "/account/applications"
                }
            ],
        },
        {
            title: "Tài chính",
            url: "",
            icon: DollarSign,
            isActive: true,
            items: [
                {
                    title: "Học phí",
                    url: "/account/tuition",
                }
            ],
        }
        // {
        //     title: "Luyện thi bằng lái",
        //     url: "",
        //     icon: BookOpen,
        //     isActive: true,
        //     items: [
        //         {
        //             title: "Lịch sử thi thử",
        //             url: "",
        //         },
        //         {
        //             title: "Lịch học thực hành",
        //             url: "",
        //         },
        //         {
        //             title: "Lịch sử thuê xe",
        //             url: "",
        //         },
        //     ],
        // }
    ],
    otherNavItems: [
        {
            name: "Lịch sử giao dịch",
            url: "/account/transactions",
            icon: History,
        }
    ],
}

type Props = {

} & React.ComponentProps<typeof Sidebar>;

export function AppSidebar({ ...props }: Props) {

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TopNav />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavOthers items={data.otherNavItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser  />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}