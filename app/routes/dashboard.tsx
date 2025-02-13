import { Link, Outlet } from "@remix-run/react"
import { Piano } from "lucide-react"
import React from "react"
import Navbar from "~/components/dashboard/navbar"
import Menu from "~/components/dashboard/sidebar"

export default function DashboardLayout() {
    const [isCollapsed, setIsCollapsed] = React.useState(false)

    return (
        <div className="h-screen flex">
            {/* Sidebar */}
            <div
                className={`${isCollapsed ? "w-[60px]" : "w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%]"
                    } transition-all duration-300 ease-in-out bg-white p-4 border-r flex flex-col`}
            >
                <div className="flex items-center gap-2 mb-4">
                    <Link to="/" className="flex items-center shrink-0">
                        <Piano className="shrink-0" />
                    </Link>
                    <Link to="/" className={`transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0" : "w-auto"}`}>
                        <span className="font-bold whitespace-nowrap">PhotonPiano</span>
                    </Link>
                </div>
                <Menu isCollapsed={isCollapsed} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <Navbar onMenuClick={() => setIsCollapsed(!isCollapsed)} />
                <div className="flex-1 bg-[#F7F8FA] p-4 overflow-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}