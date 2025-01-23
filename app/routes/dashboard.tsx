import { Link } from "@remix-run/react";
import { Piano } from "lucide-react";
import Navbar from "~/components/dashboard/navbar";
import Menu from "~/components/dashboard/sidebar";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="h-screen flex">
            {/* LEFT */}
            <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4">
                <Link to={"/"}
                    className="flex items-center justify-center lg:justify-center gap-2">
                    <Piano />
                    <span className="hidden lg:block font-bold">
                        PhotonPiano
                    </span>
                </Link>
                <Menu />
            </div>

            {/* RIGHT */}
            <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
                <Navbar />
                {children}
            </div>
        </div>
    );
}