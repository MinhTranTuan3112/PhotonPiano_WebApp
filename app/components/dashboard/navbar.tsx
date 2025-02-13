import { Menu, MenuIcon } from "lucide-react";
import Image from "../ui/image";

interface NavbarProps {
    onMenuClick: () => void
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
    return (
        <div className="flex items-center justify-between p-4 bg-white">
            <button onClick={onMenuClick} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Menu className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex items-center gap-6">
                <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer shadow-sm">
                    <img src="/app/lib/assets/images/message.png" alt="Messages" className="w-5 h-5" />
                </div>
                <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer shadow-sm relative">
                    <img src="/app/lib/assets/images/announcement.png" alt="Announcements" className="w-5 h-5" />
                    <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">
                        1
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs leading-3 font-medium">Test User</span>
                    <span className="text-[10px] text-gray-500 text-right">Admin</span>
                </div>
                <img src="/app/lib/assets/images/avatar.png" alt="User avatar" className="w-9 h-9 rounded-full" />
            </div>
        </div>
    )
}

export default Navbar