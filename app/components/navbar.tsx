import * as React from "react"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "./ui/navigation-menu"
import { Link, useLocation, useNavigate, useRouteLoaderData } from "@remix-run/react"
import { cn } from "~/lib/utils"
import { Button, buttonVariants } from "./ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet"
import { Loader2, Menu, Piano, X } from "lucide-react"
import { Separator } from "./ui/separator"
import pianoBackgroundImg from '../lib/assets/images/piano_background.jpg';
import { loader } from "~/root"
import AccountDropdown from "./auth/account-dropdown"
import { Level, Role } from "~/lib/types/account/account"
import { useQuery } from "@tanstack/react-query"
import { fetchLevels } from "~/lib/services/level"

const navItems = [
    { name: "Trang chủ", href: "/", role: [Role.Guest, Role.Administrator, Role.Instructor, Role.Staff, Role.Student] },
    { name: "Quản lý học tập", href: "/account/scheduler", role: [Role.Student] },
    { name: "Quản lý dạy học", href: "/teacher/scheduler", role: [Role.Instructor] },
    { name: "Quản lý thông tin", href: "/staff/scheduler", role: [Role.Staff] },
    { name: "Quản lý trung tâm", href: "/admin/scheduler", role: [Role.Administrator] },
    { name: "Tin tức", href: "/news", role: [Role.Guest, Role.Administrator, Role.Instructor, Role.Staff, Role.Student] },
    { name: "Giảng viên", href: "/instructors", role: [Role.Guest, Role.Administrator, Role.Instructor, Role.Staff, Role.Student] },
    { name: "Đăng nhập", href: "/sign-in", role: [Role.Guest] },
]

type Props = {

}

export default function NavBar({ }: Props) {

    const authData = useRouteLoaderData<typeof loader>("root");

    const [isOpen, setIsOpen] = React.useState(false);

    const [isScrolling, setIsScrolling] = React.useState(false);

    const { pathname } = useLocation();

    React.useEffect(() => {

        const handleScroll = () => {
            if (window.scrollY > 5) {
                setIsScrolling(true);
            } else {
                setIsScrolling(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };

    }, []);

    const navigate = useNavigate();

    return (
        <div className={`p-6 flex items-center sticky top-0 w-full bg-white transition-shadow duration-300 ${isScrolling ? 'shadow-md' : ''} z-50`}>
            <div className="w-full h-full flex md:gap-10 max-md:justify-between flex-row items-center">

                <Link className="flex items-center space-x-3" to={'/'}>
                    <div className="relative">
                        <Piano className="h-8 w-8 text-indigo-600 animate-pulse" />
                        <div className="absolute -top-1 -right-1 h-2 w-2 bg-teal-400 rounded-full animate-bounce" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">Photon Piano</h1>
                </Link>

                <NavigationMenu className="hidden md:block">
                    <NavigationMenuList>
                        <NavigationMenuItem className={`${pathname === '/intro' ? buttonVariants({ variant: 'theme' }) : ''}`}>
                            <NavigationMenuTrigger className="uppercase font-bold">About Us</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                    <li className="row-span-3" style={{
                                        backgroundImage: `url(${pianoBackgroundImg})`,
                                        backgroundSize: 'cover',
                                    }}>
                                        <NavigationMenuLink asChild>
                                            <Link
                                                to="/"
                                                className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                            >
                                                <div className="mb-2 mt-4 text-lg font-medium">
                                                    Photon Piano
                                                </div>
                                                <p className="text-sm leading-tight text-muted-foreground">
                                                    Learn piano with professional teachers with many years of experience.
                                                </p>
                                            </Link>
                                        </NavigationMenuLink>
                                    </li>
                                    <ListItem href="/about" title="About us">
                                        Find out about the history and development of the center.
                                    </ListItem>
                                    <ListItem href="/instructors" title="Teachers">
                                        Meet our experienced teachers.
                                    </ListItem>
                                    <ListItem href="/facilities" title="Facilities and equipment">
                                        Discover our modern training facilities and equipment.
                                    </ListItem>
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <LevelsDropdown />

                        {/* <NavigationMenuItem>
                            <Link to="/entrance-tests" className={`${navigationMenuTriggerStyle()} uppercase font-bold ${pathname.startsWith('/entrance-tests') ? buttonVariants({ variant: 'theme' }) : ''}`}>
                                Thi xếp lớp đầu vào
                            </Link>
                        </NavigationMenuItem> */}
                        <NavigationMenuItem>
                            <Link to="/news" className={`${navigationMenuTriggerStyle()} uppercase font-bold `}>
                                News
                            </Link>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <Link to="/instructors" className={`${navigationMenuTriggerStyle()} uppercase font-bold`}>
                                Teachers
                            </Link>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>

                <section className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" className="px-2">
                                <span className="sr-only">Open menu</span>
                                {isOpen ? (
                                    <X className="h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="h-6 w-6" aria-hidden="true" />
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <SheetTitle className="mb-3">Menu</SheetTitle>
                            <nav className="flex flex-col gap-4">
                                {navItems.map((item, index) => {
                                    return (
                                        (authData && authData.role && item.role.includes(authData.role as Role) ||
                                            ((!authData || !authData.role) && item.role.includes(Role.Guest))) && (
                                            <React.Fragment key={item.name}>
                                                <Link
                                                    to={item.href}
                                                    className="block px-3 py-2 text-base font-medium"
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    {item.name}
                                                </Link>
                                                {index < navItems.length - 1 && <Separator />}
                                            </React.Fragment>
                                        )
                                    )
                                }
                                )}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </section>
            </div>
            <div className="hidden md:block">
                {(!authData || !authData.role) ? (
                    <button onClick={() => navigate('/sign-in')} type="button"
                        className="whitespace-nowrap relative px-10 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-teal-500 text-white font-medium transition-transform hover:scale-105">
                        Sign In
                        <div className="absolute inset-0 bg-white/20 transform rotate-45 translate-x-3/4 transition-transform group-hover:translate-x-1/4"></div>
                    </button>
                ) : (
                    <>
                        <AccountDropdown accountFirebaseId={authData.currentAccountFirebaseId} role={authData.role} />
                    </>
                )}
            </div>
        </div>
    )
}

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    to={props.href || '/'}
                    ref={ref}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-bold leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"

function LevelsDropdown() {

    const { data, isLoading, isError } = useQuery({
        queryKey: ['levels'],
        queryFn: async () => {
            const response = await fetchLevels();

            return await response.data;
        },
        enabled: true,
        refetchOnWindowFocus: false,
    });

    const levels = data ? data as Level[] : [];

    // return isLoading ? <Loader2 className="w-full h-full animate-spin" /> : isError ? <div className="text-red-500">Có lỗi xảy ra</div> :
    //     (<NavigationMenuItem>
    //         <NavigationMenuTrigger className={`uppercase font-bold `}>Loại hình đào tạo</NavigationMenuTrigger>
    //         <NavigationMenuContent>
    //             <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
    //                 {levels.map((level, index) => (
    //                     <ListItem
    //                         key={level.id}
    //                         title={level.name}
    //                         href={'/'}
    //                     >
    //                         {level.description}
    //                     </ListItem>
    //                 ))}
    //             </ul>
    //         </NavigationMenuContent>
    //     </NavigationMenuItem>)

    return <NavigationMenuItem>
        <NavigationMenuTrigger className={`uppercase font-bold `}>Level Courses</NavigationMenuTrigger>
        <NavigationMenuContent>
            {isLoading ? (
                <Loader2 className="w-full h-full animate-spin" />
            ) : isError ? (
                <div className="text-red-500">Error Occured</div>
            ) : (
                <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {levels.map((level) => (
                        <Link
                            key={level.id}
                            to={`levels/${level.id}`}
                            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={
                                {
                                    "--theme-color": level.themeColor,
                                    focusRingColor: level.themeColor,
                                } as React.CSSProperties
                            }
                        >
                            {/* Theme color accent bar */}
                            <div
                                className="absolute top-0 left-0 w-full h-1 transition-all duration-200 group-hover:h-2"
                                style={{ backgroundColor: level.themeColor }}
                            />

                            {/* Theme color dot indicator */}
                            <div className="flex items-start gap-3">
                                <div
                                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                                    style={{ backgroundColor: level.themeColor }}
                                />
                                <div className="flex-1 min-w-0">
                                    <h3
                                        className="font-semibold text-sm mb-1 transition-colors duration-200 group-hover:text-gray-900"
                                        style={{ color: level.themeColor }}
                                    >
                                        {level.name}
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-200">
                                        {level.description}
                                    </p>
                                </div>
                            </div>

                            {/* Subtle background pattern on hover */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-200 pointer-events-none"
                                style={{ backgroundColor: level.themeColor }}
                            />
                        </Link>
                    ))}
                </div>
            )}
        </NavigationMenuContent>
    </NavigationMenuItem>

}