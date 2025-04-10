import { Link } from "@remix-run/react";
import { role } from "~/lib/test-data";


interface SidebarProps {
    isCollapsed: boolean
}

const menuItems = [
    {
        title: "MENU",
        items: [
            {
                icon: "/app/lib/assets/images/home.png",
                label: "Home",
                href: "/dashboard",
                visible: ["admin", "student", "staff", "teacher"]
            },
            {
                icon: "/app/lib/assets/images/class.png",
                label: "Classes",
                href: "/dashboard/class",
                visible: ["admin", "teacher"],
            },
        ]
    }
]

const Sidebar = ({ isCollapsed }: SidebarProps) => {
    return (
        <div className="mt-4 text-sm">
            {menuItems.map((i) => (
                <div className="flex flex-col gap-2" key={i.title}>
                    <span
                        className={`text-gray-400 font-light my-4 transition-all duration-300 ${isCollapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
                            }`}
                    >
                        {i.title}
                    </span>
                    {i.items.map((item) => {
                        if (item.visible.includes(role)) {
                            return (
                                <Link
                                    to={item.href}
                                    key={item.label}
                                    className="flex items-center gap-4 text-gray-500 py-2 px-2 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    <img
                                        src={item.icon || "/placeholder.svg"}
                                        alt={`${item.label} icon`}
                                        className="w-6 h-6 object-contain shrink-0"
                                    />
                                    <span
                                        className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? "w-0" : "w-auto"
                                            }`}
                                    >
                                        {item.label}
                                    </span>
                                </Link>
                            )
                        }
                        return null
                    })}
                </div>
            ))}
        </div>
    )
}

export default Sidebar