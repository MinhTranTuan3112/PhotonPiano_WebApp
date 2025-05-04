import * as React from "react"
import {
    CircleUserRound,
    DollarSign,
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
            title: "General",
            url: "",
            icon: CircleUserRound,
            isActive: true,
            items: [
                {
                    title: "Personal profile",
                    url: "/account/profile",
                },
                {
                    title: "My free slots",
                    url: "/account/free-slots",
                }
            ],
        },
        {
            title: "Academic",
            url: "",
            icon: Music,
            isActive: true,
            items: [
                {
                    title: "Schedule",
                    url: "/account/scheduler",
                },
                {
                    title: "My classes",
                    url: "/account/classes",
                },
                {
                    title: "My exams",
                    url: "/account/my-exams",
                },

                {
                    title: "My applications",
                    url: "/account/applications"
                },
                {
                    title: "My certificates",
                    url: "/account/certificates",
                }
            ],
        },
        {
            title: "Tuition",
            url: "",
            icon: DollarSign,
            isActive: true,
            items: [
                {
                    title: "Tuition",
                    url: "/account/tuition",
                }
            ],
        }
        ,
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
            name: "Transaction history",
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
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}