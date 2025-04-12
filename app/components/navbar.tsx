import * as React from "react"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "./ui/navigation-menu"
import { Link, useLocation, useNavigate, useNavigation, useRouteLoaderData, useSubmit } from "@remix-run/react"
import { cn } from "~/lib/utils"
import { Button, buttonVariants } from "./ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet"
import { Loader2, Menu, Piano, X } from "lucide-react"
import { Separator } from "./ui/separator"
import pianoBackgroundImg from '../lib/assets/images/piano_background.jpg';
import { loader } from "~/root"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
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

    const submit = useSubmit();

    const navigation = useNavigation();

    const navigate = useNavigate();

    const isSubmitting = navigation.state === 'submitting';

    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận đăng xuất?',
        description: 'Bạn có chắc chắn muốn đăng xuất?',
        onConfirm: () => {
            submit(null, {
                method: 'POST',
                action: '/sign-out'
            });
        },
        confirmText: 'Đăng xuất',
    });


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
                            <NavigationMenuTrigger className="uppercase font-bold">Giới thiệu</NavigationMenuTrigger>
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
                                                    Học piano trực tuyến với các giáo viên chuyên nghiệp và nhiều năm kinh nghiệm.
                                                </p>
                                            </Link>
                                        </NavigationMenuLink>
                                    </li>
                                    <ListItem href="/about" title="Về chúng tôi">
                                        Tìm hiểu về lịch sử hình thành và phát triển của trung tâm
                                    </ListItem>
                                    <ListItem href="/instructors" title="Đội ngũ giảng viên">
                                        Gặp gỡ các giảng viên giàu kinh nghiệm của chúng tôi.
                                    </ListItem>
                                    <ListItem href="/facilities" title="Cơ sở vật chất">
                                        Khám phá các cơ sở đào tạo và cơ sở vật chất hiện đại của chúng tôi.
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
                                Tin tức
                            </Link>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <Link to="/instructors" className={`${navigationMenuTriggerStyle()} uppercase font-bold`}>
                                Giảng viên
                            </Link>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>

                <section className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" className="px-2">
                                <span className="sr-only">Mở menu</span>
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
                    <button onClick={() => navigate('/sign-in')} type="button" className="relative w-full px-6 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-teal-500 text-white font-medium transition-transform hover:scale-105">
                        Đăng nhập
                        <div className="absolute inset-0 bg-white/20 transform rotate-45 translate-x-3/4 transition-transform group-hover:translate-x-1/4" />
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
        }
    });

    const levels = data ? data as Level[] : [];

    return isLoading ? <Loader2 className="w-full h-full animate-spin" /> : isError ? <div className="text-red-500">Có lỗi xảy ra</div> :
        (<NavigationMenuItem>
            <NavigationMenuTrigger className={`uppercase font-bold `}>Loại hình đào tạo</NavigationMenuTrigger>
            <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                    {levels.map((level, index) => (
                        <ListItem
                            key={level.id}
                            title={level.name}
                            href={'/'}
                        >
                            {level.description}
                        </ListItem>
                    ))}
                </ul>
            </NavigationMenuContent>
        </NavigationMenuItem>)

}