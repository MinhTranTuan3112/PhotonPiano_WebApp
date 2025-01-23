import { Link } from "@remix-run/react";
import { role } from "~/lib/test-data";
import Image from "../ui/image";

const menuItems = [
    {
        title: "MENU",
        items: [
            {
                icon: "app/lib/assets/images/class.png",
                label: "Home",
                href: "/",
                visible: ["admin", "student", "staff", "teacher"]
            },
            {
                icon: "app/lib/assets/images/class.png",
                label: "Classes",
                href: "/list/classes",
                visible: ["admin", "teacher"],
            },
        ]
    }
]

const Menu = () => {
    return (
        <div className="mt-4 text-sm">
            {menuItems.map((i) => (
                <div className="flex flex-col gap-2" key={i.title}>
                    <span className="hidden lg:block text-gray-400 font-light my-4">
                        {i.title}
                    </span>
                    {i.items.map((item) => {
                        if (item.visible.includes(role)) {
                            const IconComponent = item.icon
                            return (
                                <Link
                                    to={item.href}
                                    key={item.label}
                                    className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-secondary"
                                >
                                    <img
                                        src={item.icon || "/placeholder.svg"}
                                        alt={`${item.label} icon`}
                                        width={20}
                                        height={20}
                                        className="w-8 h-8 object-contain"
                                    />
                                    <span className="hidden lg:block">{item.label}</span>
                                </Link>
                            )
                        }
                        return null;
                    })}
                </div>
            ))}
        </div>
    );
};

export default Menu;