
import { Link } from "@remix-run/react"
import { Piano } from "lucide-react"

// Footer sections data
const sections = [
    {
        title: "About Us",
        links: [
            { name: "Our Story", href: "/about" },
            { name: "Mission & Vision", href: "/about/mission" },
            { name: "Facilities", href: "/about/facilities" },
            { name: "Testimonials", href: "/about/testimonials" },
            { name: "Careers", href: "/about/careers" },
        ],
    },
    {
        title: "News",
        links: [
            { name: "Latest Updates", href: "/news" },
            { name: "Events", href: "/news/events" },
            { name: "Recitals", href: "/news/recitals" },
            { name: "Competitions", href: "/news/competitions" },
            { name: "Blog", href: "/blog" },
        ],
    },
    {
        title: "Teachers",
        links: [
            { name: "Our Faculty", href: "/teachers" },
            { name: "Teaching Philosophy", href: "/teachers/philosophy" },
            { name: "Guest Artists", href: "/teachers/guest-artists" },
            { name: "Masterclasses", href: "/teachers/masterclasses" },
        ],
    },
]


export default function Footer() {
    return (
        <footer className="relative bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 border-t border-slate-200 dark:border-slate-800">
            {/* Piano Keys Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-black via-white to-black"></div>


            <div className="container px-4 py-16">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-6">
                    {/* Logo and description */}
                    <div className="col-span-1 md:col-span-2">
                        {/* <div className="flex items-center gap-3 mb-6">
                            <div className="relative">
                                <img
                                    src="/piano.png"
                                    alt="Photon Piano Center logo"
                                    width={48}
                                    height={48}
                                    className="size-12 drop-shadow-md"
                                />
                                <div className="absolute -bottom-1 -right-1 bg-sky-600 rounded-full p-1">
                                    <Music className="size-3 text-white" />
                                </div>
                            </div>
                            <h2 className="font-bold text-2xl tracking-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                                    Photon Piano
                                </span>
                            </h2>
                        </div> */}
                        <Link className="flex items-center space-x-3" to={'/'}>
                            <div className="relative">
                                <Piano className="h-8 w-8 text-indigo-600 animate-pulse" />
                                <div className="absolute -top-1 -right-1 h-2 w-2 bg-teal-400 rounded-full animate-bounce" />
                            </div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">Photon Piano</h1>
                        </Link>
                        <p className="text-slate-600 dark:text-slate-400 max-w-xs mb-8 italic my-3">
                            "Inspiring musical excellence through innovative piano education."
                        </p>

                    </div>

                    {/* Footer sections */}
                    {sections.map((section, idx) => (
                        <div key={idx} className="col-span-1">
                            <h3 className="font-semibold text-base mb-5 relative inline-block">
                                {section.title}
                                <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-sky-600"></span>
                            </h3>


                            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                                {section.links.map((link, linkIdx) => (
                                    <li key={linkIdx}>
                                        <Link
                                            to={link.href}
                                            className="hover:text-sky-600 transition-colors duration-300 flex items-center group"
                                        >
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity mr-2">♪</span>
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>

                        </div>
                    ))}
                </div>

                {/* Piano keyboard divider */}
                <div className="relative my-12">
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-slate-200 dark:bg-slate-800"></div>
                    <div className="relative flex justify-center">
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
                            <div className="flex items-center space-x-1">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="w-3 h-6 bg-white border border-slate-300 dark:border-slate-700 rounded-sm"
                                    ></div>
                                ))}
                                <div className="w-3 h-4 bg-black -mx-0.5 rounded-sm z-10"></div>
                                <div className="w-3 h-4 bg-black -mx-0.5 rounded-sm z-10"></div>
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i + 5}
                                        className="w-3 h-6 bg-white border border-slate-300 dark:border-slate-700 rounded-sm"
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom section with copyright and policies */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
                    <p>© {new Date().getFullYear()} Photon Piano Center. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="/terms" className="hover:text-sky-600 transition-colors duration-300">
                            Terms & Conditions
                        </Link>
                        <Link to="/privacy" className="hover:text-sky-600 transition-colors duration-300">
                            Privacy Policy
                        </Link>
                        <Link to="/sitemap" className="hover:text-sky-600 transition-colors duration-300">
                            Sitemap
                        </Link>
                    </div>
                </div>
            </div>

            {/* Piano Keys Bottom Border */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-black via-white to-black"></div>
        </footer>
    )
}
